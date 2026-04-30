package com.mmchessman.timetablepro

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

class NotificationReceiver : BroadcastReceiver() {

    companion object {
        const val CHANNEL_ID = "class_notifications"
        const val EXTRA_SUBJECT = "extra_subject"
        const val EXTRA_TIME = "extra_time"
        const val EXTRA_CLASSROOM = "extra_classroom"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val subject = intent.getStringExtra(EXTRA_SUBJECT) ?: "Upcoming Class"
        val time = intent.getStringExtra(EXTRA_TIME) ?: ""
        val classroom = intent.getStringExtra(EXTRA_CLASSROOM) ?: ""

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create the NotificationChannel, but only on API 26+ because
        // the NotificationChannel class is new and not in the support library
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Class Notifications"
            val descriptionText = "Notifications for upcoming classes"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
            // Register the channel with the system
            notificationManager.createNotificationChannel(channel)
        }

        val contentText = if (classroom.isNotEmpty()) {
            "Starts at $time in $classroom"
        } else {
            "Starts at $time"
        }

        // Create an explicit intent for an Activity in your app
        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent: android.app.PendingIntent = android.app.PendingIntent.getActivity(
            context, 0, launchIntent,
            android.app.PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher_round) // Replace with a transparent white icon if available
            .setContentTitle(subject)
            .setContentText(contentText)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            
        // Use a unique ID for each notification based on the subject string hash, or just 1 if we only want one active notification
        val notificationId = subject.hashCode()
        
        notificationManager.notify(notificationId, builder.build())
    }
}
