from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import HotelProfile, Product, Service, MyOrder, OrderItem

User = get_user_model()


class HotelProfileInline(admin.StackedInline):
    model = HotelProfile
    can_delete = False
    extra = 0
    fk_name = "user"


try:
    admin.site.unregister(User)
except admin.sites.NotRegistered:
    pass


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    inlines = [HotelProfileInline]


@admin.register(HotelProfile)
class HotelProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "hotel_name", "hotel_id", "contact_location", "user")
    search_fields = ("hotel_name", "hotel_id", "contact_location", "user__username")

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "price", "quantity", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "price", "quantity", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(MyOrder)
class MyOrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "phone", "status", "estimated_completion_at", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("user__username", "phone")
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "product", "service", "quantity", "total_price")
    list_filter = ("product", "service")
