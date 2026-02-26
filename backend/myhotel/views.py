import json

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from .models import HotelProfile, MyOrder, OrderItem, Product, Service
from .serializers import MyOrderSerializer, ProductSerializer, ServiceSerializer, UserSummarySerializer

User = get_user_model()


@require_GET
def api_health(request):
    return JsonResponse({"status": "ok"})


def _parse_body(request):
    try:
        return json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}


def _auth_error():
    return JsonResponse({"detail": "Authentication required."}, status=401)


def _admin_required(request):
    if not request.user.is_authenticated:
        return _auth_error()
    if not request.user.is_superuser:
        return JsonResponse({"detail": "Admin access required."}, status=403)
    return None


@csrf_exempt
@require_POST
def api_register(request):
    payload = _parse_body(request)
    hotel_name = (payload.get("hotel_name") or "").strip()
    contact_location = (payload.get("contact_location") or "").strip()
    hotel_id = (payload.get("hotel_id") or "").strip()
    password = payload.get("password") or ""
    confirm_password = payload.get("confirm_password") or ""

    if not hotel_name or not contact_location or not hotel_id or not password:
        return JsonResponse(
            {"detail": "Hotel name, contact location, hotel ID, and password are required."},
            status=400,
        )

    if password != confirm_password:
        return JsonResponse({"detail": "Passwords do not match."}, status=400)

    if HotelProfile.objects.filter(hotel_id__iexact=hotel_id).exists():
        return JsonResponse({"detail": "Hotel ID already exists."}, status=400)
    if User.objects.filter(username__iexact=hotel_id).exists():
        return JsonResponse({"detail": "Username/Hotel ID already exists."}, status=400)

    try:
        validate_password(password)
    except ValidationError as exc:
        return JsonResponse({"detail": " ".join(exc.messages)}, status=400)

    try:
        with transaction.atomic():
            user = User.objects.create_user(username=hotel_id, password=password)
            HotelProfile.objects.create(
                user=user,
                hotel_name=hotel_name,
                contact_location=contact_location,
                hotel_id=hotel_id,
            )
    except IntegrityError:
        return JsonResponse({"detail": "Hotel ID already exists."}, status=400)
    except Exception:
        return JsonResponse({"detail": "Registration failed. Try again."}, status=500)

    login(request, user)
    return JsonResponse(
        {
            "detail": "Registration successful.",
            "user": UserSummarySerializer(user).data,
        },
        status=201,
    )


@csrf_exempt
@require_POST
def api_login(request):
    payload = _parse_body(request)
    identifier = (payload.get("identifier") or payload.get("hotel_id") or payload.get("username") or "").strip()
    password = payload.get("password") or ""

    if not identifier or not password:
        return JsonResponse({"detail": "Hotel ID/username and password are required."}, status=400)

    # Support login by username, email, or hotel_id (case-insensitive).
    # Username is checked first so superuser/admin login is always direct.
    user_candidate = User.objects.filter(username__iexact=identifier).first()
    if not user_candidate and "@" in identifier:
        user_candidate = User.objects.filter(email__iexact=identifier).first()
    if not user_candidate:
        user_candidate = User.objects.filter(hotel_profile__hotel_id__iexact=identifier).first()

    candidate_usernames = []
    if user_candidate:
        candidate_usernames.append(user_candidate.username)
    candidate_usernames.append(identifier)
    candidate_usernames.append(identifier.lower())

    user = None
    for username in dict.fromkeys(candidate_usernames):
        user = authenticate(request, username=username, password=password)
        if user is not None:
            break

    if user is None:
        return JsonResponse({"detail": "Invalid hotel ID/username or password."}, status=400)

    login(request, user)
    return JsonResponse(
        {
            "detail": "Login successful.",
            "user": UserSummarySerializer(user).data,
            "admin_url": "/admin/" if user.is_superuser else None,
        }
    )


@csrf_exempt
@require_POST
def api_logout(request):
    logout(request)
    return JsonResponse({"detail": "Logout successful."})


@require_GET
def api_me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False, "user": None}, status=401)

    return JsonResponse(
        {
            "authenticated": True,
            "user": UserSummarySerializer(request.user).data,
        }
    )


@require_GET
def api_products(request):
    if not request.user.is_authenticated:
        return _auth_error()

    queryset = Product.objects.all().order_by("name")
    if not request.user.is_superuser:
        queryset = queryset.filter(is_active=True)
    data = ProductSerializer(queryset, many=True).data
    return JsonResponse({"products": data})


@require_GET
def api_services(request):
    if not request.user.is_authenticated:
        return _auth_error()

    queryset = Service.objects.all().order_by("name")
    if not request.user.is_superuser:
        queryset = queryset.filter(is_active=True)
    data = ServiceSerializer(queryset, many=True).data
    return JsonResponse({"services": data})


@require_GET
def api_my_orders(request):
    if not request.user.is_authenticated:
        return _auth_error()

    orders = (
        MyOrder.objects.filter(user=request.user)
        .select_related("user__hotel_profile")
        .prefetch_related("orderitem_set__product", "orderitem_set__service")
        .order_by("-created_at")
    )
    return JsonResponse({"orders": MyOrderSerializer(orders, many=True).data})


@csrf_exempt
@require_POST
def api_create_order(request):
    if not request.user.is_authenticated:
        return _auth_error()

    payload = _parse_body(request)
    phone = (payload.get("phone") or "").strip()
    product_id = payload.get("product")
    service_id = payload.get("service")
    try:
        default_quantity = int(payload.get("quantity") or 1)
    except (TypeError, ValueError):
        return JsonResponse({"detail": "Quantity must be a number."}, status=400)
    try:
        product_quantity = int(payload.get("product_quantity") or default_quantity)
        service_quantity = int(payload.get("service_quantity") or default_quantity)
    except (TypeError, ValueError):
        return JsonResponse({"detail": "Product and service quantities must be numbers."}, status=400)

    if not phone:
        return JsonResponse({"detail": "Phone number is required."}, status=400)

    if not product_id and not service_id:
        return JsonResponse({"detail": "Choose at least one product or service."}, status=400)

    product = None
    service = None

    if product_id:
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return JsonResponse({"detail": "Selected product is unavailable."}, status=400)
        if product_quantity < 1:
            return JsonResponse({"detail": "Product quantity must be at least 1."}, status=400)
        if product_quantity > product.quantity:
            return JsonResponse({"detail": "Requested product quantity exceeds available stock."}, status=400)

    if service_id:
        try:
            service = Service.objects.get(id=service_id, is_active=True)
        except Service.DoesNotExist:
            return JsonResponse({"detail": "Selected service is unavailable."}, status=400)
        if service_quantity < 1:
            return JsonResponse({"detail": "Service quantity must be at least 1."}, status=400)
        if service_quantity > service.quantity:
            return JsonResponse({"detail": "Requested service quantity exceeds available capacity."}, status=400)

    order = MyOrder.objects.create(user=request.user, phone=phone, status="Pending")
    if product:
        OrderItem.objects.create(order=order, product=product, quantity=product_quantity, unit_price=product.price)
    if service:
        OrderItem.objects.create(order=order, service=service, quantity=service_quantity, unit_price=service.price)

    order.refresh_from_db()
    return JsonResponse({"detail": "Order created.", "order": MyOrderSerializer(order).data}, status=201)


@require_GET
def api_admin_dashboard(request):
    admin_error = _admin_required(request)
    if admin_error:
        return admin_error

    orders = (
        MyOrder.objects.all()
        .select_related("user", "user__hotel_profile")
        .prefetch_related("orderitem_set__product", "orderitem_set__service")
        .order_by("-created_at")
    )
    products_queryset = Product.objects.all().order_by("name")
    services_queryset = Service.objects.all().order_by("name")
    products = ProductSerializer(products_queryset, many=True).data
    services = ServiceSerializer(services_queryset, many=True).data
    return JsonResponse(
        {
            "orders": MyOrderSerializer(orders, many=True).data,
            "products": products,
            "services": services,
            "total_orders": len(orders),
            "total_products": len(products),
            "total_services": len(services),
        }
    )


@csrf_exempt
@require_POST
def api_admin_update_order(request, order_id):
    admin_error = _admin_required(request)
    if admin_error:
        return admin_error

    payload = _parse_body(request)
    status = (payload.get("status") or "").strip()
    admin_feedback = (payload.get("admin_feedback") or "").strip()
    estimated_completion_raw = (payload.get("estimated_completion_at") or "").strip()

    status_aliases = {
        "approve": "Accepted",
        "approved": "Accepted",
        "accept": "Accepted",
        "accepted": "Accepted",
        "reject": "Rejected",
        "rejected": "Rejected",
        "complete": "Completed",
        "completed": "Completed",
        "pending": "Pending",
    }
    normalized_status = status_aliases.get(status.lower(), status) if status else ""

    valid_statuses = {choice[0] for choice in MyOrder.STATUS_CHOICES}
    if normalized_status and normalized_status not in valid_statuses:
        return JsonResponse({"detail": "Invalid status."}, status=400)

    estimated_completion_at = None
    if estimated_completion_raw:
        parsed = parse_datetime(estimated_completion_raw)
        if parsed is None:
            return JsonResponse({"detail": "Invalid completion datetime format."}, status=400)
        estimated_completion_at = timezone.make_aware(parsed) if timezone.is_naive(parsed) else parsed

    try:
        with transaction.atomic():
            order = MyOrder.objects.select_for_update().get(id=order_id)
            previous_status = order.status

            if normalized_status:
                order.status = normalized_status
            order.admin_feedback = admin_feedback
            order.estimated_completion_at = estimated_completion_at

            if normalized_status == "Accepted" and previous_status != "Accepted":
                order_items = list(order.orderitem_set.all())
                product_ids = [item.product_id for item in order_items if item.product_id]
                service_ids = [item.service_id for item in order_items if item.service_id]
                products = {
                    product.id: product
                    for product in Product.objects.select_for_update().filter(id__in=product_ids)
                }
                services = {
                    service.id: service
                    for service in Service.objects.select_for_update().filter(id__in=service_ids)
                }

                for item in order_items:
                    if item.product_id:
                        product = products.get(item.product_id)
                        if not product or item.quantity > product.quantity:
                            return JsonResponse(
                                {"detail": "Insufficient product stock for this order."},
                                status=400,
                            )
                    if item.service_id:
                        service = services.get(item.service_id)
                        if not service or item.quantity > service.quantity:
                            return JsonResponse(
                                {"detail": "Insufficient service capacity for this order."},
                                status=400,
                            )

                for item in order_items:
                    if item.product_id:
                        product = products[item.product_id]
                        product.quantity -= item.quantity
                        product.save(update_fields=["quantity"])
                    if item.service_id:
                        service = services[item.service_id]
                        service.quantity -= item.quantity
                        service.save(update_fields=["quantity"])

            if not order.admin_feedback:
                if order.status == "Accepted":
                    order.admin_feedback = "Order approved and now being prepared."
                elif order.status == "Rejected":
                    order.admin_feedback = "Order rejected. Please contact admin for details."
                elif order.status == "Completed":
                    order.admin_feedback = "Order completed and ready/served."

            order.save(update_fields=["status", "admin_feedback", "estimated_completion_at"])
    except MyOrder.DoesNotExist:
        return JsonResponse({"detail": "Order not found."}, status=404)

    return JsonResponse({"detail": "Order updated.", "order": MyOrderSerializer(order).data})


@csrf_exempt
@require_POST
def api_admin_create_product(request):
    admin_error = _admin_required(request)
    if admin_error:
        return admin_error

    payload = _parse_body(request)
    name = (payload.get("name") or "").strip()
    price = payload.get("price")
    quantity = payload.get("quantity")

    if not name or price in (None, "") or quantity in (None, ""):
        return JsonResponse({"detail": "Name, price, and quantity are required."}, status=400)

    try:
        price = float(price)
        quantity = int(quantity)
    except (TypeError, ValueError):
        return JsonResponse({"detail": "Price must be a number and quantity must be an integer."}, status=400)

    if price <= 0:
        return JsonResponse({"detail": "Price must be greater than 0."}, status=400)
    if quantity < 0:
        return JsonResponse({"detail": "Quantity cannot be negative."}, status=400)

    product = Product.objects.create(name=name, price=price, quantity=quantity, is_active=True)
    return JsonResponse({"detail": "Product created.", "product": ProductSerializer(product).data}, status=201)


@csrf_exempt
@require_POST
def api_admin_create_service(request):
    admin_error = _admin_required(request)
    if admin_error:
        return admin_error

    payload = _parse_body(request)
    name = (payload.get("name") or "").strip()
    price = payload.get("price")
    quantity = payload.get("quantity")

    if not name or price in (None, "") or quantity in (None, ""):
        return JsonResponse({"detail": "Name, price, and quantity are required."}, status=400)

    try:
        price = float(price)
        quantity = int(quantity)
    except (TypeError, ValueError):
        return JsonResponse({"detail": "Price must be a number and quantity must be an integer."}, status=400)

    if price <= 0:
        return JsonResponse({"detail": "Price must be greater than 0."}, status=400)
    if quantity < 0:
        return JsonResponse({"detail": "Quantity cannot be negative."}, status=400)

    service = Service.objects.create(name=name, price=price, quantity=quantity, is_active=True)
    return JsonResponse({"detail": "Service created.", "service": ServiceSerializer(service).data}, status=201)


@csrf_exempt
@require_POST
def api_admin_toggle_product(request, product_id):
    admin_error = _admin_required(request)
    if admin_error:
        return admin_error

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"detail": "Product not found."}, status=404)

    payload = _parse_body(request)
    is_active = payload.get("is_active")
    if not isinstance(is_active, bool):
        return JsonResponse({"detail": "is_active must be true or false."}, status=400)

    product.is_active = is_active
    product.save(update_fields=["is_active"])
    return JsonResponse({"detail": "Product updated.", "product": ProductSerializer(product).data})


@csrf_exempt
@require_POST
def api_admin_update_product(request, product_id):
    admin_error = _admin_required(request)
    if admin_error:
        return admin_error

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"detail": "Product not found."}, status=404)

    payload = _parse_body(request)
    name = (payload.get("name") or product.name).strip()
    price = payload.get("price", product.price)
    quantity = payload.get("quantity", product.quantity)

    try:
        price = float(price)
        quantity = int(quantity)
    except (TypeError, ValueError):
        return JsonResponse({"detail": "Price must be a number and quantity must be an integer."}, status=400)

    if not name:
        return JsonResponse({"detail": "Name is required."}, status=400)
    if price <= 0:
        return JsonResponse({"detail": "Price must be greater than 0."}, status=400)
    if quantity < 0:
        return JsonResponse({"detail": "Quantity cannot be negative."}, status=400)

    product.name = name
    product.price = price
    product.quantity = quantity
    product.save(update_fields=["name", "price", "quantity"])
    return JsonResponse({"detail": "Product details updated.", "product": ProductSerializer(product).data})


@csrf_exempt
@require_POST
def api_admin_toggle_service(request, service_id):
    admin_error = _admin_required(request)
    if admin_error:
        return admin_error

    try:
        service = Service.objects.get(id=service_id)
    except Service.DoesNotExist:
        return JsonResponse({"detail": "Service not found."}, status=404)

    payload = _parse_body(request)
    is_active = payload.get("is_active")
    if not isinstance(is_active, bool):
        return JsonResponse({"detail": "is_active must be true or false."}, status=400)

    service.is_active = is_active
    service.save(update_fields=["is_active"])
    return JsonResponse({"detail": "Service updated.", "service": ServiceSerializer(service).data})


@csrf_exempt
@require_POST
def api_admin_update_service(request, service_id):
    admin_error = _admin_required(request)
    if admin_error:
        return admin_error

    try:
        service = Service.objects.get(id=service_id)
    except Service.DoesNotExist:
        return JsonResponse({"detail": "Service not found."}, status=404)

    payload = _parse_body(request)
    name = (payload.get("name") or service.name).strip()
    price = payload.get("price", service.price)
    quantity = payload.get("quantity", service.quantity)

    try:
        price = float(price)
        quantity = int(quantity)
    except (TypeError, ValueError):
        return JsonResponse({"detail": "Price must be a number and quantity must be an integer."}, status=400)

    if not name:
        return JsonResponse({"detail": "Name is required."}, status=400)
    if price <= 0:
        return JsonResponse({"detail": "Price must be greater than 0."}, status=400)
    if quantity < 0:
        return JsonResponse({"detail": "Quantity cannot be negative."}, status=400)

    service.name = name
    service.price = price
    service.quantity = quantity
    service.save(update_fields=["name", "price", "quantity"])
    return JsonResponse({"detail": "Service details updated.", "service": ServiceSerializer(service).data})


@csrf_exempt
@require_POST
def api_admin_delete_order(request, order_id):
    admin_error = _admin_required(request)
    if admin_error:
        return admin_error

    try:
        order = MyOrder.objects.get(id=order_id)
    except MyOrder.DoesNotExist:
        return JsonResponse({"detail": "Order not found."}, status=404)

    order.delete()
    return JsonResponse({"detail": "Order deleted."})


@csrf_exempt
@require_POST
def api_admin_delete_user(request, user_id):
    admin_error = _admin_required(request)
    if admin_error:
        return admin_error

    try:
        target_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"detail": "User not found."}, status=404)

    if target_user.is_superuser:
        return JsonResponse({"detail": "Cannot delete admin user."}, status=400)
    if target_user.id == request.user.id:
        return JsonResponse({"detail": "Cannot delete your own user."}, status=400)

    target_user.delete()
    return JsonResponse({"detail": "User deleted."})
