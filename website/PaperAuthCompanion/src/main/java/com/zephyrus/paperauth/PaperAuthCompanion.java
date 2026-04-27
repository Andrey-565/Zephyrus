package com.zephyrus.paperauth;

import org.bukkit.plugin.java.JavaPlugin;
import com.zephyrus.paperauth.commands.ChestCommand;
import com.zephyrus.paperauth.commands.ExchangeCommand;
import com.zephyrus.paperauth.commands.LinkCommand;
import com.zephyrus.paperauth.listeners.InventoryListener;
import com.zephyrus.paperauth.listeners.PlayerJoinListener;

public class PaperAuthCompanion extends JavaPlugin {

    private static PaperAuthCompanion instance;
    private String apiUrl;
    private String pluginSecret;

    @Override
    public void onEnable() {
        instance = this;
        saveDefaultConfig();

        apiUrl = getConfig().getString("api-url", "http://localhost:8000");
        pluginSecret = getConfig().getString("plugin-secret", "change-this-plugin-secret");

        getCommand("link").setExecutor(new LinkCommand(this));
        getCommand("chest").setExecutor(new ChestCommand(this));
        getCommand("exchange").setExecutor(new ExchangeCommand(this));

        getServer().getPluginManager().registerEvents(new InventoryListener(this), this);
        getServer().getPluginManager().registerEvents(new PlayerJoinListener(this), this);

        getLogger().info("PaperAuthCompanion enabled! API: " + apiUrl);
    }

    @Override
    public void onDisable() {
        getLogger().info("PaperAuthCompanion disabled.");
    }

    public static PaperAuthCompanion getInstance() { return instance; }
    public String getApiUrl() { return apiUrl; }
    public String getPluginSecret() { return pluginSecret; }
}
