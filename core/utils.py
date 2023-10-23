from datetime import datetime
import pytz


def format_time_difference(end_time):
    ist = pytz.timezone('Asia/Kolkata')  # IST timezone
    current_time = datetime.now(ist)  # Get the current time in IST

    time_difference = current_time - end_time

    if time_difference.days > 0:
        return f'{time_difference.days} day(s)'
    elif time_difference.seconds >= 3600:
        hours = time_difference.seconds // 3600
        return f'{hours} hour(s)'
    elif time_difference.seconds >= 60:
        minutes = time_difference.seconds // 60
        return f'{minutes} minute(s)'
    else:
        seconds = time_difference.seconds
        return f'{seconds} second(s)'