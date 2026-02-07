from django.db import models
from django.contrib.auth.models import User

class Company(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    contact_person = models.CharField(max_length=255)
    contact_email = models.EmailField()

    def __str__(self):
        return self.name

class Internship(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='internships')
    position = models.CharField(max_length=100)
    description = models.TextField()
    slots = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.position} at {self.company.name}"

class Application(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="api_applications")
    internship = models.ForeignKey(Internship, on_delete=models.CASCADE)
    status = models.CharField(max_length=50, default="Pending")
    applied_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.internship.position}"
