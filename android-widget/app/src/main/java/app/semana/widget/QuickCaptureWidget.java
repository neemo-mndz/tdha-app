package app.semana.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

public class QuickCaptureWidget extends AppWidgetProvider {
    static final String PREFS = "quick_capture";

    static void update(Context context, AppWidgetManager manager, int widgetId) {
        String origin = context.getSharedPreferences(PREFS, 0).getString("origin", "");
        Intent intent = origin.isEmpty()
            ? new Intent(context, ConfigureActivity.class)
            : new Intent(Intent.ACTION_VIEW, Uri.parse(origin + "/quick-capture"));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        PendingIntent click = PendingIntent.getActivity(context, widgetId, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.quick_capture_widget);
        views.setOnClickPendingIntent(R.id.capture, click);
        manager.updateAppWidget(widgetId, views);
    }

    @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) update(context, manager, id);
    }
}
