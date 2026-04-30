package com.mmchessman.timetablepro

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import org.json.JSONObject

class CCEWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return CCEViewsFactory(this.applicationContext, intent)
    }
}

class CCEViewsFactory(
    private val context: Context,
    private val intent: Intent
) : RemoteViewsService.RemoteViewsFactory {

    private val items = mutableListOf<CCEItem>()

    data class CCEItem(
        val topic: String,
        val type: String,
        val subject: String,
        val deadline: String,
        val completed: Boolean
    )

    override fun onCreate() {}

    override fun onDataSetChanged() {
        items.clear()
        
        var cceJson: String? = null
        val possibleFiles = arrayOf("CapacitorStorage", context.packageName + "_preferences", "storage")
        for (fileName in possibleFiles) {
            val prefs = context.getSharedPreferences(fileName, Context.MODE_PRIVATE)
            cceJson = prefs.getString("cce_works", null) ?: prefs.getString("_cap_cce_works", null)
            if (cceJson != null) break
        }

        if (cceJson != null) {
            try {
                val cceData = JSONObject(cceJson)
                val subjects = cceData.keys()
                
                while (subjects.hasNext()) {
                    val subjectName = subjects.next()
                    val works = cceData.optJSONArray(subjectName)
                    if (works != null) {
                        for (i in 0 until works.length()) {
                            val work = works.getJSONObject(i)
                            if (!work.optBoolean("completed", false)) {
                                items.add(
                                    CCEItem(
                                        topic = work.optString("topic", ""),
                                        type = work.optString("type", "assignment"),
                                        subject = subjectName,
                                        deadline = work.optString("deadline", ""),
                                        completed = false
                                    )
                                )
                            }
                        }
                    }
                }
            } catch (e: Exception) {}
        }
        
        // Sort by topic or subject
        items.sortBy { it.subject }
    }

    override fun onDestroy() {
        items.clear()
    }

    override fun getCount(): Int = items.size

    override fun getViewAt(position: Int): RemoteViews {
        val item = items[position]
        val views = RemoteViews(context.packageName, R.layout.widget_cce_item)
        
        views.setTextViewText(R.id.tv_cce_topic, item.topic)
        views.setTextViewText(R.id.tv_cce_subject, item.subject)
        views.setTextViewText(R.id.tv_cce_deadline, item.deadline)
        
        val typeLetter = item.type.firstOrNull()?.uppercase() ?: "A"
        views.setTextViewText(R.id.tv_cce_type_letter, typeLetter)

        return views
    }

    override fun getLoadingView(): RemoteViews? = null
    override fun getViewTypeCount(): Int = 1
    override fun getItemId(position: Int): Long = position.toLong()
    override fun hasStableIds(): Boolean = true
}
