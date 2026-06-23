package com.mmchessman.timetablepro

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import org.json.JSONObject
import java.util.Calendar
import java.text.SimpleDateFormat
import java.util.Locale

class FullTimetableWidgetProvider : AppWidgetProvider() {

    companion object {
        const val ACTION_NEXT_DAY = "com.mmchessman.timetablepro.ACTION_NEXT_DAY"
        const val ACTION_PREV_DAY = "com.mmchessman.timetablepro.ACTION_PREV_DAY"
        const val ACTION_TOGGLE_FREE = "com.mmchessman.timetablepro.ACTION_TOGGLE_FREE"
        const val EXTRA_WIDGET_ID = "extra_widget_id"
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        val action = intent.action
        val appWidgetId = intent.getIntExtra(EXTRA_WIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
        
        if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
            val prefs = context.getSharedPreferences("FullTimetableWidget", Context.MODE_PRIVATE)
            val currentOffset = prefs.getInt("day_offset_$appWidgetId", 0)
            val showFree = prefs.getBoolean("show_free_$appWidgetId", false)

            when (action) {
                ACTION_NEXT_DAY -> prefs.edit().putInt("day_offset_$appWidgetId", currentOffset + 1).apply()
                ACTION_PREV_DAY -> prefs.edit().putInt("day_offset_$appWidgetId", currentOffset - 1).apply()
                ACTION_TOGGLE_FREE -> prefs.edit().putBoolean("show_free_$appWidgetId", !showFree).apply()
            }

            if (action == ACTION_NEXT_DAY || action == ACTION_PREV_DAY || action == ACTION_TOGGLE_FREE) {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                updateAppWidget(context, appWidgetManager, appWidgetId)
                appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.widget_list_view)
            }
        }
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val prefs = context.getSharedPreferences("FullTimetableWidget", Context.MODE_PRIVATE)
        val dayOffset = prefs.getInt("day_offset_$appWidgetId", 0)
        val showFree = prefs.getBoolean("show_free_$appWidgetId", false)

        val views = RemoteViews(context.packageName, R.layout.widget_full_timetable)

        // Set up the intent that starts the RemoteViewsService
        val intent = Intent(context, FullTimetableWidgetService::class.java).apply {
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
            data = Uri.parse(toUri(Intent.URI_INTENT_SCHEME))
        }

        views.setRemoteAdapter(R.id.widget_list_view, intent)
        views.setEmptyView(R.id.widget_list_view, R.id.widget_empty_view)

        // Calculate Target Day
        val targetCal = Calendar.getInstance()
        targetCal.add(Calendar.DAY_OF_YEAR, dayOffset)
        
        val format = SimpleDateFormat("EEEE", Locale.US)
        var dayString = format.format(targetCal.time).uppercase()
        
        // Add relative hints
        val todayCal = Calendar.getInstance()
        val diffDays = targetCal.get(Calendar.DAY_OF_YEAR) - todayCal.get(Calendar.DAY_OF_YEAR) + 
                       (targetCal.get(Calendar.YEAR) - todayCal.get(Calendar.YEAR)) * 365
        
        if (diffDays == 0) dayString = "$dayString (TODAY)"
        else if (diffDays == 1) dayString = "$dayString (TOMORROW)"

        views.setTextViewText(R.id.tv_day_title, dayString)
        views.setTextColor(R.id.btn_toggle_free, if (showFree) 0xFF60A5FA.toInt() else 0xFF94A3B8.toInt()) // Blue 400 or Slate 400

        // Buttons
        views.setOnClickPendingIntent(R.id.btn_prev_day, getPendingIntent(context, ACTION_PREV_DAY, appWidgetId))
        views.setOnClickPendingIntent(R.id.btn_next_day, getPendingIntent(context, ACTION_NEXT_DAY, appWidgetId))
        views.setOnClickPendingIntent(R.id.btn_toggle_free, getPendingIntent(context, ACTION_TOGGLE_FREE, appWidgetId))
        
        // Refresh button
        val refreshIntent = Intent(context, FullTimetableWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
            putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(appWidgetId))
        }
        val refreshPending = PendingIntent.getBroadcast(
            context, appWidgetId + 1000, refreshIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        views.setOnClickPendingIntent(R.id.btn_refresh_full, refreshPending)

        appWidgetManager.updateAppWidget(appWidgetId, views)
    }

    private fun getPendingIntent(context: Context, action: String, appWidgetId: Int): PendingIntent {
        val intent = Intent(context, FullTimetableWidgetProvider::class.java).apply {
            this.action = action
            putExtra(EXTRA_WIDGET_ID, appWidgetId)
        }
        return PendingIntent.getBroadcast(
            context, appWidgetId, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}

