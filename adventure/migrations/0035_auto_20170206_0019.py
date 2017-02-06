# -*- coding: utf-8 -*-
# Generated by Django 1.10.3 on 2017-02-06 08:19
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adventure', '0034_adventure_dead_body_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='adventure',
            name='dead_body_id',
            field=models.IntegerField(blank=True, default=0, help_text='The artifact ID of the first dead body. Leave blank to not use dead body artifacts.', null=True),
        ),
    ]
