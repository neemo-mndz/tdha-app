package app.semana.widget;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

public class ConfigureActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        setResult(RESULT_CANCELED);
        int widgetId = getIntent().getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        int pad = (int) (24 * getResources().getDisplayMetrics().density);
        layout.setPadding(pad, pad * 2, pad, pad);
        TextView title = new TextView(this);
        title.setText("semana. — Registro rápido");
        title.setTextSize(24);
        layout.addView(title);
        TextView label = new TextView(this);
        label.setText("Endereço de produção do seu app (https://…)");
        layout.addView(label);
        EditText url = new EditText(this);
        url.setSingleLine(true);
        url.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        url.setHint("https://seu-app.vercel.app");
        url.setText(getSharedPreferences(QuickCaptureWidget.PREFS, 0).getString("origin", ""));
        layout.addView(url);
        Button save = new Button(this);
        save.setText("Salvar");
        layout.addView(save);
        TextView help = new TextView(this);
        help.setText("Depois, mantenha pressionada a tela inicial, escolha Widgets e procure semana. Registro rápido. Use o mesmo navegador em que instalou o app para aproveitar sua sessão.");
        layout.addView(help);
        save.setOnClickListener(view -> {
            Uri parsed = Uri.parse(url.getText().toString().trim());
            if (!"https".equalsIgnoreCase(parsed.getScheme()) || parsed.getHost() == null
                || parsed.getUserInfo() != null || parsed.getPort() != -1
                || (parsed.getPath() != null && !parsed.getPath().isEmpty() && !"/".equals(parsed.getPath()))
                || parsed.getQuery() != null || parsed.getFragment() != null) {
                url.setError("Informe apenas a URL HTTPS principal do app.");
                return;
            }
            String origin = "https://" + parsed.getHost();
            getSharedPreferences(QuickCaptureWidget.PREFS, 0).edit().putString("origin", origin).apply();
            AppWidgetManager manager = AppWidgetManager.getInstance(this);
            int[] ids = manager.getAppWidgetIds(new ComponentName(this, QuickCaptureWidget.class));
            for (int id : ids) QuickCaptureWidget.update(this, manager, id);
            if (widgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                QuickCaptureWidget.update(this, manager, widgetId);
                setResult(RESULT_OK, new Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId));
            }
            finish();
        });
        setContentView(layout);
    }
}
