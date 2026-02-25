from django.urls import path
from . import views

urlpatterns = [
    path('api/register/', views.api_register, name='api_register'),
    path('api/login/', views.api_login, name='api_login'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/me/', views.api_me, name='api_me'),
    path('api/products/', views.api_products, name='api_products'),
    path('api/services/', views.api_services, name='api_services'),
    path('api/my-orders/', views.api_my_orders, name='api_my_orders'),
    path('api/create-order/', views.api_create_order, name='api_create_order'),
    path('api/admin-dashboard/', views.api_admin_dashboard, name='api_admin_dashboard'),
    path('api/admin/orders/<int:order_id>/update/', views.api_admin_update_order, name='api_admin_update_order'),
    path('api/admin/orders/<int:order_id>/delete/', views.api_admin_delete_order, name='api_admin_delete_order'),
    path('api/admin/users/<int:user_id>/delete/', views.api_admin_delete_user, name='api_admin_delete_user'),
    path('api/admin/products/create/', views.api_admin_create_product, name='api_admin_create_product'),
    path('api/admin/services/create/', views.api_admin_create_service, name='api_admin_create_service'),
    path('api/admin/products/<int:product_id>/toggle-active/', views.api_admin_toggle_product, name='api_admin_toggle_product'),
    path('api/admin/products/<int:product_id>/update/', views.api_admin_update_product, name='api_admin_update_product'),
    path('api/admin/services/<int:service_id>/toggle-active/', views.api_admin_toggle_service, name='api_admin_toggle_service'),
    path('api/admin/services/<int:service_id>/update/', views.api_admin_update_service, name='api_admin_update_service'),
]
