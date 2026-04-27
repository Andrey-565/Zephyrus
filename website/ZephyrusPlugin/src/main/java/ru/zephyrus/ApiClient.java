package ru.zephyrus;

import org.bukkit.Bukkit;
import org.bukkit.scheduler.BukkitRunnable;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Scanner;
import java.util.function.Consumer;

public class ApiClient {

    private final ZephyrusPlugin plugin;

    public ApiClient(ZephyrusPlugin plugin) {
        this.plugin = plugin;
    }

    /** POST JSON to the API asynchronously, callback on main thread */
    public void post(String endpoint, String jsonBody, Consumer<String> onSuccess, Consumer<String> onError) {
        new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    URL url = new URL(plugin.getApiUrl() + endpoint);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("x-plugin-secret", plugin.getPluginSecret());
                    conn.setDoOutput(true);
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(15000);

                    byte[] body = jsonBody.getBytes(StandardCharsets.UTF_8);
                    conn.setRequestProperty("Content-Length", String.valueOf(body.length));
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(body);
                    }

                    int code = conn.getResponseCode();
                    java.io.InputStream is = code >= 400 ? conn.getErrorStream() : conn.getInputStream();
                    Scanner scanner = new Scanner(is, StandardCharsets.UTF_8).useDelimiter("\\A");
                    String response = scanner.hasNext() ? scanner.next() : "";

                    final String finalResponse = response;
                    final boolean success = code < 400;
                    Bukkit.getScheduler().runTask(plugin, () -> {
                        if (success) onSuccess.accept(finalResponse);
                        else onError.accept(finalResponse);
                    });

                } catch (Exception e) {
                    Bukkit.getScheduler().runTask(plugin, () ->
                        onError.accept("Ошибка соединения с сервером: " + e.getMessage())
                    );
                }
            }
        }.runTaskAsynchronously(plugin);
    }

    /** GET from the API asynchronously */
    public void get(String endpoint, Consumer<String> onSuccess, Consumer<String> onError) {
        new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    URL url = new URL(plugin.getApiUrl() + endpoint);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setRequestProperty("x-plugin-secret", plugin.getPluginSecret());
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(15000);

                    int code = conn.getResponseCode();
                    java.io.InputStream is = code >= 400 ? conn.getErrorStream() : conn.getInputStream();
                    Scanner scanner = new Scanner(is, StandardCharsets.UTF_8).useDelimiter("\\A");
                    String response = scanner.hasNext() ? scanner.next() : "";

                    final String finalResponse = response;
                    final boolean success = code < 400;
                    Bukkit.getScheduler().runTask(plugin, () -> {
                        if (success) onSuccess.accept(finalResponse);
                        else onError.accept(finalResponse);
                    });

                } catch (Exception e) {
                    Bukkit.getScheduler().runTask(plugin, () ->
                        onError.accept("Ошибка соединения с сервером: " + e.getMessage())
                    );
                }
            }
        }.runTaskAsynchronously(plugin);
    }
}
