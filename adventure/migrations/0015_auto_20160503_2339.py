# -*- coding: utf-8 -*-
# Generated by Django 1.9.5 on 2016-05-04 06:39
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adventure', '0014_auto_20160419_2324'),
    ]

    operations = [
        migrations.AlterField(
            model_name='player',
            name='gender',
            field=models.CharField(choices=[('m', 'Male'), ('f', 'Female')], max_length=6),
        ),
        migrations.AlterField(
            model_name='playerartifact',
            name='dice',
            field=models.IntegerField(default=1, null=True),
        ),
        migrations.AlterField(
            model_name='playerartifact',
            name='odds',
            field=models.IntegerField(default=0, null=True),
        ),
        migrations.AlterField(
            model_name='playerartifact',
            name='sides',
            field=models.IntegerField(default=1, null=True),
        ),
        migrations.AlterField(
            model_name='playerartifact',
            name='weapon_type',
            field=models.IntegerField(choices=[(1, 'Axe'), (2, 'Bow'), (3, 'Club'), (4, 'Spear'), (5, 'Sword')], default=0, null=True),
        ),
    ]
