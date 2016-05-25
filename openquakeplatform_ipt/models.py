from django.db import models

# Create your models here.
from openquakeplatform_server import settings

print settings.__file__

class ServerSide(models.Model):
    filepath = models.FilePathField(path=settings.FILE_PATH_FIELD_DIRECTORY, recursive=True)
