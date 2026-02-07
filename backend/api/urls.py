from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('dashboard/', views.dashboard, name='dashboard'),

    # Companies
    path('companies/', views.companies, name='companies'),
    path('companies/<int:pk>/', views.company_detail, name='company_detail'),

    # Internships
    path('internships/', views.internships, name='internships'),
    path('internships/<int:pk>/', views.internship_detail, name='internship_detail'),

    # Applications
    path('applications/', views.applications, name='applications'),
    path('applications/<int:pk>/', views.application_detail, name='application_detail'),
    path('applications/<int:pk>/status/', views.update_application_status, name='update_application_status'),
]
