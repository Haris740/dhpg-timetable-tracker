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

class TasksWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return TasksViewsFactory(this.applicationContext, intent)
    }
}

class TasksViewsFactory(
    private val context: Context,
    private val intent: Intent
) : RemoteViewsService.RemoteViewsFactory {

    private val appWidgetId = intent.getIntExtra(
        AppWidgetManager.EXTRA_APPWIDGET_ID,
        AppWidgetManager.INVALID_APPWIDGET_ID
    )

    private val items = mutableListOf<TaskItem>()

    data class TaskItem(
        val title: String,
        val startTime: String,
        val endTime: String,
        val completed: Boolean
    )

    override fun onCreate() {}

    override fun onDataSetChanged() {
        items.clear()
        
        var tasksJson: String? = null
        val possibleFiles = arrayOf("CapacitorStorage", context.packageName + "_preferences", "storage")
        for (fileName in possibleFiles) {
            val prefs = context.getSharedPreferences(fileName, Context.MODE_PRIVATE)
            tasksJson = prefs.getString("personal_tasks", null) ?: prefs.getString("_cap_personal_tasks", null)
            if (tasksJson != null) break
        }

        if (tasksJson != null) {
            try {
                val tasksData = JSONObject(tasksJson)
                val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Calendar.getInstance().time)
                val dayTasks = tasksData.optJSONArray(today)
                
                if (dayTasks != null) {
                    for (i in 0 until dayTasks.length()) {
                        val task = dayTasks.getJSONObject(i)
                        items.add(
                            TaskItem(
                                title = task.optString("title", ""),
                                startTime = task.optString("startTime", ""),
                                endTime = task.optString("endTime", ""),
                                completed = task.optBoolean("completed", false)
                            )
                        )
                    }
                }
            } catch (e: Exception) {}
        }
        
        // Sort by start time
        items.sortBy { it.startTime }
    }

    override fun onDestroy() {
        items.clear()
    }

    override fun getCount(): Int = items.size

    override fun getViewAt(position: Int): RemoteViews {
        val item = items[position]
        val views = RemoteViews(context.packageName, R.layout.widget_tasks_item)
        
        views.setTextViewText(R.id.tv_task_title, item.title)
        views.setTextViewText(R.id.tv_task_time, "${item.startTime} - ${item.endTime}")
        
        if (item.completed) {
            views.setViewVisibility(R.id.tv_task_check, android.view.View.VISIBLE)
            views.setInt(R.id.task_checkbox, "setBackgroundResource", R.drawable.badge_bg)
            views.setTextColor(R.id.tv_task_title, 0xFF94A3B8.toInt())
        } else {
            views.setViewVisibility(R.id.tv_task_check, android.view.View.GONE)
            views.setInt(R.id.task_checkbox, "setBackgroundColor", 0x33FFFFFF)
            views.setTextColor(R.id.tv_task_title, 0xFFFFFFFF.toInt())
        }

        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true
}
