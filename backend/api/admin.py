from django.contrib import admin
from .models import Company, Internship, Application
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

class ApplicationInline(admin.TabularInline):
    model = Application
    extra = 0
    readonly_fields = ('internship', 'status', 'applied_at')

class UserAdmin(BaseUserAdmin):
    inlines = BaseUserAdmin.inlines + (ApplicationInline,)

admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'contact_email', 'address')
    search_fields = ('name', 'contact_person', 'contact_email')

@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
    list_display = ('position', 'company', 'slots', 'created_at')
    list_filter = ('company',)

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('student', 'internship', 'status', 'applied_at')
    list_filter = ('status', 'internship__company')
    search_fields = ('student__username', 'internship__position')
