# Generated by Django 2.1.1 on 2019-02-16 06:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('adventure', '0050_monster_special'),
    ]

    operations = [
        migrations.AddField(
            model_name='hintanswer',
            name='spoiler',
            field=models.BooleanField(default=False, help_text='Obscure the answer until the user shows it.'),
        ),
    ]
