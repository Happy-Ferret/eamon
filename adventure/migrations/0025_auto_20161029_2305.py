# -*- coding: utf-8 -*-
# Generated by Django 1.10.2 on 2016-10-30 06:05
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adventure', '0024_hint_hintanswer'),
    ]

    operations = [
        migrations.AddField(
            model_name='adventure',
            name='first_hint',
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name='adventure',
            name='last_hint',
            field=models.IntegerField(null=True),
        ),
    ]
