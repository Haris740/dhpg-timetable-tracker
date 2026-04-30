package com.mmchessman.timetablepro

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import android.content.SharedPreferences
import org.json.JSONObject
import java.util.*
import java.text.SimpleDateFormat
import com.mmchessman.timetablepro.R

class TimetableWidget : AppWidgetProvider() {
    companion object {
        const val ACTION_AUTO_UPDATE = "com.mmchessman.timetablepro.ACTION_AUTO_UPDATE"
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
        scheduleNextUpdate(context)
    }

    override fun onReceive(context: Context, intent: android.content.Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_AUTO_UPDATE) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(context, TimetableWidget::class.java)
            )
            for (appWidgetId in appWidgetIds) {
                updateAppWidget(context, appWidgetManager, appWidgetId)
            }
            scheduleNextUpdate(context)
        }
    }

    override fun onEnabled(context: Context) {
        scheduleNextUpdate(context)
    }

    override fun onDisabled(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
        val intent = android.content.Intent(context, TimetableWidget::class.java).apply {
            action = ACTION_AUTO_UPDATE
        }
        val pendingIntent = android.app.PendingIntent.getBroadcast(
            context, 0, intent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(pendingIntent)
    }
}

internal fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
    val views = RemoteViews(context.packageName, R.layout.timetable_widget)
    
    try {
        // Try multiple possible locations for Capacitor Preferences
        val possibleFiles = arrayOf("CapacitorStorage", context.packageName + "_preferences", "storage")
        var timetableJson: String? = null
        
        for (fileName in possibleFiles) {
            val prefs = context.getSharedPreferences(fileName, Context.MODE_PRIVATE)
            timetableJson = prefs.getString("timetable", null) ?: prefs.getString("_cap_timetable", null)
            if (timetableJson != null) break
        }
        
        // Fallback to default preferences
        if (timetableJson == null) {
            val defaultPrefs = android.preference.PreferenceManager.getDefaultSharedPreferences(context)
            timetableJson = defaultPrefs.getString("timetable", null) ?: defaultPrefs.getString("_cap_timetable", null)
        }

        val now = Calendar.getInstance()
        val dayFormat = SimpleDateFormat("EEEE", Locale.US)
        val currentDay = dayFormat.format(now.time)
        
        views.setTextViewText(R.id.widget_day, currentDay.uppercase())
        
        if (timetableJson != null) {
            val timetable = JSONObject(timetableJson)
            val dayData = timetable.optJSONObject(currentDay)
            
            if (dayData != null) {
                val currentPeriod = getCurrentPeriod(now)
                
                // Now Section
                val nowInfo = if (currentPeriod != -1) dayData.optJSONObject(currentPeriod.toString()) else null
                if (nowInfo != null) {
                    val subject = nowInfo.optString("subject", "")
                    views.setTextViewText(R.id.now_subject, subject)
                    val teacher = nowInfo.optString("teacher", "")
                    val classroom = nowInfo.optString("classroom", "")
                    val time = getPeriodTimingRange(currentPeriod)
                    
                    views.setTextViewText(R.id.now_teacher, teacher)
                    views.setTextViewText(R.id.now_classroom, classroom)
                    views.setTextViewText(R.id.now_time, time)
                    
                    // Apply dynamic color
                    val color = getSubjectColor(subject)
                    views.setInt(R.id.now_section, "setBackgroundColor", color)
                } else {
                    views.setTextViewText(R.id.now_subject, "No Class")
                    views.setTextViewText(R.id.now_teacher, "Use your free time productively!")
                    views.setTextViewText(R.id.now_classroom, "")
                    views.setTextViewText(R.id.now_time, if (currentPeriod != -1) getPeriodTimingRange(currentPeriod) else "--")
                    views.setInt(R.id.now_section, "setBackgroundColor", 0xFF0F172A.toInt()) // Default Slate
                }
                
                // Next Section (Smart Skip Free Periods)
                val nextActualPeriod = getNextActualPeriod(now, dayData)
                if (nextActualPeriod != -1) {
                    val nextInfo = dayData.optJSONObject(nextActualPeriod.toString())
                    if (nextInfo != null) {
                        val subject = nextInfo.optString("subject", "")
                        views.setTextViewText(R.id.next_subject, subject)
                        val teacher = nextInfo.optString("teacher", "")
                        val classroom = nextInfo.optString("classroom", "")
                        val time = getPeriodTimingRange(nextActualPeriod)
                        
                        views.setTextViewText(R.id.next_teacher, teacher)
                        views.setTextViewText(R.id.next_classroom, classroom)
                        views.setTextViewText(R.id.next_time, time)
                        
                        // Apply dynamic color to next section too
                        val nextColor = getSubjectColor(subject)
                        views.setInt(R.id.next_section, "setBackgroundColor", nextColor)
                        
                        // Schedule notification
                        scheduleClassNotification(context, subject, classroom, nextActualPeriod)
                    }
                } else {
                    views.setTextViewText(R.id.next_subject, "No more classes today")
                    views.setTextViewText(R.id.next_teacher, "--")
                    views.setTextViewText(R.id.next_classroom, "")
                    views.setTextViewText(R.id.next_time, "--")
                    views.setInt(R.id.next_section, "setBackgroundColor", 0xFF0F172A.toInt()) // Default Slate
                }
            } else {
                views.setTextViewText(R.id.now_subject, "No Data")
                views.setTextViewText(R.id.now_teacher, "Please setup timetable in app")
            }
        } else {
            views.setTextViewText(R.id.now_subject, "Welcome")
            views.setTextViewText(R.id.now_teacher, "Open app to sync schedule")
        }
    } catch (e: Exception) {
        views.setTextViewText(R.id.now_subject, "Error")
        views.setTextViewText(R.id.now_teacher, e.message ?: "Unknown error")
    }

    // Refresh button
    val refreshIntent = android.content.Intent(context, TimetableWidget::class.java).apply {
        action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(appWidgetId))
    }
    val refreshPending = android.app.PendingIntent.getBroadcast(
        context, appWidgetId + 2000, refreshIntent,
        android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
    )
    views.setOnClickPendingIntent(R.id.btn_refresh_single, refreshPending)

    appWidgetManager.updateAppWidget(appWidgetId, views)
}

fun getCurrentPeriod(now: Calendar): Int {
    val minutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
    
    // Timings from types/index.ts
    // 1: 07:35 AM - 08:25 AM (455 - 505)
    // 2: 08:50 AM - 09:40 AM (530 - 580)
    // 3: 09:45 AM - 10:35 AM (585 - 635)
    // 4: 10:40 AM - 11:30 AM (640 - 690)
    // 5: 11:35 AM - 12:25 PM (695 - 745)
    // 6: 12:30 PM - 01:15 PM (750 - 795)
    // 7: 02:20 PM - 03:10 PM (860 - 910)
    // 8: 03:15 PM - 04:05 PM (915 - 965)
    
    val timings = arrayOf(
        intArrayOf(455, 505),
        intArrayOf(530, 580),
        intArrayOf(585, 635),
        intArrayOf(640, 690),
        intArrayOf(695, 745),
        intArrayOf(750, 795),
        intArrayOf(860, 910),
        intArrayOf(915, 965)
    )
    
    for (i in timings.indices) {
        if (minutes >= timings[i][0] && minutes <= timings[i][1]) {
            return i + 1
        }
    }
    return -1
}

fun getNextActualPeriod(now: Calendar, dayData: JSONObject): Int {
    val minutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)
    
    val timings = arrayOf(
        intArrayOf(455, 505),
        intArrayOf(530, 580),
        intArrayOf(585, 635),
        intArrayOf(640, 690),
        intArrayOf(695, 745),
        intArrayOf(750, 795),
        intArrayOf(860, 910),
        intArrayOf(915, 965)
    )
    
    // Find where we are in the day
    var currentPIdx = -1
    for (i in timings.indices) {
        if (minutes < timings[i][1]) { // We haven't finished this period yet
            currentPIdx = i
            break
        }
    }
    
    if (currentPIdx == -1) return -1 // End of day
    
    // Look for the next period that has data, starting from current + 1
    for (i in (currentPIdx + 1) until timings.size) {
        if (dayData.has((i + 1).toString())) {
            return i + 1
        }
    }
    
    return -1
}

fun getPeriodStartTime(number: Int): String {
    return when(number) {
        1 -> "07:35 AM"
        2 -> "08:50 AM"
        3 -> "09:45 AM"
        4 -> "10:40 AM"
        5 -> "11:35 AM"
        6 -> "12:30 PM"
        7 -> "02:20 PM"
        8 -> "03:15 PM"
        else -> ""
    }
}

fun getPeriodTimingRange(number: Int): String {
    return when(number) {
        1 -> "07:35 - 08:25"
        2 -> "08:50 - 09:40"
        3 -> "09:45 - 10:35"
        4 -> "10:40 - 11:30"
        5 -> "11:35 - 12:25"
        6 -> "12:30 - 01:15"
        7 -> "02:20 - 03:10"
        8 -> "03:15 - 04:05"
        else -> ""
    }
}

fun getSubjectColor(subject: String): Int {
    if (subject.isEmpty()) return 0xFF2563EB.toInt() // blue-600
    var hash = 0
    for (char in subject) {
        hash = char.toInt() + ((hash shl 5) - hash)
    }
    val colors = intArrayOf(
        0xFF2563EB.toInt(), // blue
        0xFFE11D48.toInt(), // rose
        0xFF059669.toInt(), // emerald
        0xFFD97706.toInt(), // amber
        0xFF7C3AED.toInt(), // violet
        0xFF4F46E5.toInt(), // indigo
        0xFF0D9488.toInt(), // teal
        0xFFEA580C.toInt(), // orange
        0xFF0891B2.toInt(), // cyan
        0xFFDB2777.toInt()  // pink
    )
    return colors[Math.abs(hash) % colors.size]
}

fun scheduleNextUpdate(context: Context) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
    val intent = android.content.Intent(context, TimetableWidget::class.java).apply {
        action = TimetableWidget.ACTION_AUTO_UPDATE
    }
    
    val pendingIntent = android.app.PendingIntent.getBroadcast(
        context, 0, intent,
        android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
    )

    // Schedule update every 5 minutes (300,000 ms)
    val nextUpdateTime = System.currentTimeMillis() + (5 * 60 * 1000)
    
    // Use setAndAllowWhileIdle to bypass battery optimization (Android 6.0+)
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
        alarmManager.setAndAllowWhileIdle(
            android.app.AlarmManager.RTC_WAKEUP,
            nextUpdateTime,
            pendingIntent
        )
    } else {
        alarmManager.set(
            android.app.AlarmManager.RTC_WAKEUP,
            nextUpdateTime,
            pendingIntent
        )
    }
}

fun scheduleClassNotification(context: Context, subject: String, classroom: String, periodNumber: Int) {
    if (subject.isEmpty()) return
    
    val timings = arrayOf(
        intArrayOf(455, 505),
        intArrayOf(530, 580),
        intArrayOf(585, 635),
        intArrayOf(640, 690),
        intArrayOf(695, 745),
        intArrayOf(750, 795),
        intArrayOf(860, 910),
        intArrayOf(915, 965)
    )
    
    if (periodNumber < 1 || periodNumber > timings.size) return
    val startTimeMinutes = timings[periodNumber - 1][0]
    
    val now = Calendar.getInstance()
    val startCal = now.clone() as Calendar
    startCal.set(Calendar.HOUR_OF_DAY, startTimeMinutes / 60)
    startCal.set(Calendar.MINUTE, startTimeMinutes % 60)
    startCal.set(Calendar.SECOND, 0)
    startCal.set(Calendar.MILLISECOND, 0)
    
    // 5 minutes before
    val alarmTime = startCal.timeInMillis - (5 * 60 * 1000)
    
    // Check if the alarm time is in the past
    if (alarmTime <= System.currentTimeMillis()) return
    
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as android.app.AlarmManager
    val intent = android.content.Intent(context, NotificationReceiver::class.java).apply {
        putExtra(NotificationReceiver.EXTRA_SUBJECT, subject)
        putExtra(NotificationReceiver.EXTRA_TIME, getPeriodStartTime(periodNumber))
        putExtra(NotificationReceiver.EXTRA_CLASSROOM, classroom)
    }
    
    val pendingIntent = android.app.PendingIntent.getBroadcast(
        context, 0, intent,
        android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
    )
    
    try {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                android.app.AlarmManager.RTC_WAKEUP,
                alarmTime,
                pendingIntent
            )
        } else {
            alarmManager.setExact(
                android.app.AlarmManager.RTC_WAKEUP,
                alarmTime,
                pendingIntent
            )
        }
    } catch (e: SecurityException) {
        // Handle case where SCHEDULE_EXACT_ALARM is not granted on Android 14+
    }
}
