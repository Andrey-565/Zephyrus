package com.zephyrus.paperauth.commands;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import com.zephyrus.paperauth.ApiClient;
import com.zephyrus.paperauth.PaperAuthCompanion;

public class LinkCommand implements CommandExecutor {

    private final PaperAuthCompanion plugin;
    private final ApiClient api;

    public LinkCommand(PaperAuthCompanion plugin) {
        this.plugin = plugin;
        this.api = new ApiClient(plugin);
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("§cТолько игрок может использовать эту команду.");
            return true;
        }
        if (args.length < 1) {
            player.sendMessage("§6Использование: §e/link <код>");
            player.sendMessage("§7Код можно найти в личном кабинете на сайте.");
            return true;
        }

        String authCode = args[0].toUpperCase();
        String mcUuid = player.getUniqueId().toString();
        String mcName = player.getName();

        String json = String.format(
            "{\"auth_code\":\"%s\",\"mc_uuid\":\"%s\",\"mc_name\":\"%s\"}",
            authCode, mcUuid, mcName
        );

        player.sendMessage("§7Привязываем аккаунт...");

        api.post("/api/plugin/verify-link", json,
            response -> {
                if (response.contains("\"success\":true")) {
                    player.sendMessage("§a✓ Аккаунт успешно привязан к сайту Zephyrus!");
                    player.sendMessage("§7Теперь вы можете использовать §e/chest §7и §e/exchange§7.");
                } else {
                    String msg = extractMessage(response);
                    player.sendMessage("§c✗ Ошибка: " + msg);
                }
            },
            error -> player.sendMessage("§c✗ Ошибка сервера (" + plugin.getApiUrl() + "): " + error)
        );

        return true;
    }

    private String extractMessage(String json) {
        int idx = json.indexOf("\"message\":\"");
        if (idx == -1) return json;
        int start = idx + 11;
        int end = json.indexOf("\"", start);
        return end > start ? json.substring(start, end) : json;
    }
}
