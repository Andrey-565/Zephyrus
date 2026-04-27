package com.zephyrus.paperauth.listeners;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import com.zephyrus.paperauth.ApiClient;
import com.zephyrus.paperauth.PaperAuthCompanion;

public class PlayerJoinListener implements Listener {

    private final PaperAuthCompanion plugin;
    private final ApiClient api;

    public PlayerJoinListener(PaperAuthCompanion plugin) {
        this.plugin = plugin;
        this.api = new ApiClient(plugin);
    }

    @EventHandler
    public void onPlayerJoin(PlayerJoinEvent event) {
        Player player = event.getPlayer();
        String mcUuid = player.getUniqueId().toString();
        String username = player.getName();
        String ip = player.getAddress().getAddress().getHostAddress();

        String json = String.format(
            "{\"mc_uuid\":\"%s\",\"username\":\"%s\",\"ip\":\"%s\"}",
            mcUuid, username, ip
        );

        api.post("/api/plugin/sync-player", json,
            response -> {
                // Silent success or log debug
            },
            error -> {
                plugin.getLogger().warning("Failed to sync player " + username + ": " + error);
            }
        );
    }
}
