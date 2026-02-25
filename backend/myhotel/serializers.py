from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import HotelProfile, MyOrder, OrderItem, Product, Service

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    is_admin = serializers.BooleanField(source="is_superuser", read_only=True)
    hotel_name = serializers.CharField(source="hotel_profile.hotel_name", read_only=True, default="")
    contact_location = serializers.CharField(source="hotel_profile.contact_location", read_only=True, default="")
    hotel_id = serializers.CharField(source="hotel_profile.hotel_id", read_only=True, default="")

    class Meta:
        model = User
        fields = ["username", "is_admin", "hotel_name", "contact_location", "hotel_id"]


class ProductSerializer(serializers.ModelSerializer):
    cost = serializers.DecimalField(source="price", max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "price", "cost", "quantity", "is_active"]


class ServiceSerializer(serializers.ModelSerializer):
    cost = serializers.DecimalField(source="price", max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Service
        fields = ["id", "name", "price", "cost", "quantity", "is_active"]


class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()
    service = serializers.SerializerMethodField()
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "service", "quantity", "unit_price", "total_price"]

    def get_product(self, obj):
        return obj.product.name if obj.product else ""

    def get_service(self, obj):
        return obj.service.name if obj.service else ""


class MyOrderSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    hotel_name = serializers.CharField(source="user.hotel_profile.hotel_name", read_only=True, default="")
    contact_location = serializers.CharField(source="user.hotel_profile.contact_location", read_only=True, default="")
    hotel_id = serializers.CharField(source="user.hotel_profile.hotel_id", read_only=True, default="")
    total_cost = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    items = serializers.SerializerMethodField()

    class Meta:
        model = MyOrder
        fields = [
            "id",
            "user_id",
            "username",
            "hotel_name",
            "contact_location",
            "hotel_id",
            "status",
            "phone",
            "estimated_completion_at",
            "admin_feedback",
            "total_cost",
            "items",
        ]

    def get_items(self, obj):
        queryset = obj.orderitem_set.select_related("product", "service").all()
        return OrderItemSerializer(queryset, many=True).data
