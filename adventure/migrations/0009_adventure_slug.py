# -*- coding: utf-8 -*-
# Generated by Django 1.9.2 on 2016-03-24 06:15
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adventure', '0008_auto_20160320_2237'),
    ]

    operations = [
        migrations.AddField(
            model_name='adventure',
            name='slug',
            field=models.SlugField(null=True),
        ),
    ]
