from django.db import models
from django.contrib.auth.models import User


class HotelProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="hotel_profile")
    hotel_name = models.CharField(max_length=255)
    contact_location = models.CharField(max_length=255)
    hotel_id = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"{self.hotel_name} ({self.hotel_id})"


# Product model
class Product(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


# Service model
class Service(models.Model):
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name


# MyOrder model
class MyOrder(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Accepted', 'Accepted'),
        ('Rejected', 'Rejected'),
        ('Completed', 'Completed')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    estimated_completion_at = models.DateTimeField(blank=True, null=True)
    admin_feedback = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"

    @property
    def total_cost(self):
        return sum(item.total_price for item in self.orderitem_set.all())


# OrderItem model
class OrderItem(models.Model):
    order = models.ForeignKey(MyOrder, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, blank=True, null=True)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, blank=True, null=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    @property
    def total_price(self):
        if self.unit_price:
            return self.unit_price * self.quantity
        price = 0
        if self.product:
            price = self.product.price * self.quantity
        if self.service:
            price = self.service.price * self.quantity
        return price
