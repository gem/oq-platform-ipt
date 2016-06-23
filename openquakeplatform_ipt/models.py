from django.db import models

# Create your models here.

from django.conf import settings

class ServerSide(models.Model):
    filepath = models.FilePathField(path=settings.FILE_PATH_FIELD_DIRECTORY, recursive=True)
