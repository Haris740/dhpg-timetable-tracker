package com.mmchessman.timetablepro

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class FullTimetableWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return FullTimetableViewsFactory(this.applicationContext, intent)
    }
}

class FullTimetableViewsFactory(
    private val context: Context,
    private val intent: Intent
) : RemoteViewsService.RemoteViewsFactory {

    private val appWidgetId = intent.getIntExtra(
        AppWidgetManager.EXTRA_APPWIDGET_ID,
        AppWidgetManager.INVALID_APPWIDGET_ID
    )

    private val items = mutableListOf<PeriodItem>()
    private var dayOffset = 0
    private var showFree = false

    data class PeriodItem(
        val periodNumber: Int,
        val subject: String,
        val teacher: String,
        val classroom: String,
        val isFree: Boolean,
        val isActive: Boolean
    )

    override fun onCreate() {}

    override fun onDataSetChanged() {
        val prefs = context.getSharedPreferences("FullTimetableWidget", Context.MODE_PRIVATE)
        dayOffset = prefs.getInt("day_offset_$appWidgetId", 0)
        showFree = prefs.getBoolean("show_free_$appWidgetId", false)

        items.clear()
        
        var timetableJson: String? = null
        val possibleFiles = arrayOf("CapacitorStorage", context.packageName + "_preferences", "storage")
        for (fileName in possibleFiles) {
            val mainPrefs = context.getSharedPreferences(fileName, Context.MODE_PRIVATE)
            timetableJson = mainPrefs.getString("timetable", null) ?: mainPrefs.getString("_cap_timetable", null)
            if (timetableJson != null) break
        }

        if (timetableJson != null) {
            try {
                val timetable = JSONObject(timetableJson)
                val targetCal = Calendar.getInstance()
                targetCal.add(Calendar.DAY_OF_YEAR, dayOffset)
                val currentDay = SimpleDateFormat("EEEE", Locale.US).format(targetCal.time)
                
                val dayData = timetable.optJSONObject(currentDay)
                
                for (i in 1..8) {
                    if (dayData != null && dayData.has(i.toString())) {
                        val periodData = dayData.getJSONObject(i.toString())
                        items.add(
                            PeriodItem(
                                periodNumber = i,
                                subject = periodData.optString("subject", ""),
                                teacher = periodData.optString("teacher", ""),
                                classroom = periodData.optString("classroom", ""),
                                isFree = false,
                                isActive = dayOffset == 0 && isPeriodActive(i)
                            )
                        )
                    } else if (showFree) {
                        items.add(
                            PeriodItem(
                                periodNumber = i,
                                subject = "Free Period",
                                teacher = "",
                                classroom = "",
                                isFree = true,
                                isActive = dayOffset == 0 && isPeriodActive(i)
                            )
                        )
                    }
                }
            } catch (e: Exception) {
                // Ignore parsing errors
            }
        }
    }

    override fun onDestroy() {
        items.clear()
    }

    override fun getCount(): Int = items.size

    override fun getViewAt(position: Int): RemoteViews {
        val item = items[position]
        val views = RemoteViews(context.packageName, R.layout.widget_full_timetable_item)
        
        views.setTextViewText(R.id.tv_period_number, "P${item.periodNumber}")
        views.setTextViewText(R.id.tv_period_time, getPeriodTimeLines(item.periodNumber))
        
        if (item.isFree) {
            views.setTextViewText(R.id.tv_subject, "Free Period")
            views.setTextViewText(R.id.tv_teacher, "--")
            views.setTextViewText(R.id.tv_classroom, "")
            views.setInt(R.id.item_container, "setBackgroundResource", R.drawable.widget_list_item_bg)
            views.setTextColor(R.id.tv_subject, 0xFF94A3B8.toInt()) // Slate 400
        } else {
            views.setTextViewText(R.id.tv_subject, item.subject)
            views.setTextViewText(R.id.tv_teacher, item.teacher)
            views.setTextViewText(R.id.tv_classroom, item.classroom)
            val bgResource = getSubjectBackgroundResource(item.subject)
            views.setInt(R.id.item_container, "setBackgroundResource", bgResource)
            views.setTextColor(R.id.tv_subject, 0xFFFFFFFF.toInt())
        }

        if (item.isActive) {
            views.setViewVisibility(R.id.tv_active_badge, android.view.View.VISIBLE)
        } else {
            views.setViewVisibility(R.id.tv_active_badge, android.view.View.GONE)
        }

        // Add a blank intent to make it clickable if needed in future
        views.setOnClickFillInIntent(R.id.item_container, Intent())
        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true

    private fun getPeriodTimeLines(number: Int): String {
        return when(number) {
            1 -> "07:35\n08:25"
            2 -> "08:50\n09:40"
            3 -> "09:45\n10:35"
            4 -> "10:40\n11:30"
            5 -> "11:35\n12:25"
            6 -> "12:30\n01:15"
            7 -> "02:20\n03:10"
            8 -> "03:15\n04:05"
            else -> ""
        }
    }

    private fun isPeriodActive(periodNumber: Int): Boolean {
        val cal = Calendar.getInstance()
        val currentMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)
        
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
        
        if (periodNumber < 1 || periodNumber > 8) return false
        val range = timings[periodNumber - 1]
        return currentMinutes in range[0]..range[1]
    }

    private fun getSubjectBackgroundResource(subject: String): Int {
        if (subject.isEmpty()) return R.drawable.widget_item_bg_blue
        
        var hash = 0
        for (char in subject) {
            hash = char.code + ((hash shl 5) - hash)
        }
        
        val drawables = intArrayOf(
            R.drawable.widget_item_bg_blue,
            R.drawable.widget_item_bg_rose,
            R.drawable.widget_item_bg_emerald,
            R.drawable.widget_item_bg_amber,
            R.drawable.widget_item_bg_violet,
            R.drawable.widget_item_bg_indigo,
            R.drawable.widget_item_bg_teal,
            R.drawable.widget_item_bg_orange,
            R.drawable.widget_item_bg_cyan,
            R.drawable.widget_item_bg_pink
        )
        
        return drawables[Math.abs(hash) % drawables.size]
    }
}
