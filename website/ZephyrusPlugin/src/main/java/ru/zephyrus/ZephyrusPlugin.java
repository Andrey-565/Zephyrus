package ru.zephyrus;

import org.bukkit.plugin.java.JavaPlugin;
import ru.zephyrus.commands.ChestCommand;
import ru.zephyrus.commands.ExchangeCommand;
import ru.zephyrus.commands.LinkCommand;
import ru.zephyrus.listeners.InventoryListener;

public class ZephyrusPlugin extends JavaPlugin {

    private static ZephyrusPlugin instance;
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

        getLogger().info("ZephyrusPlugin enabled! API: " + apiUrl);
    }

    @Override
    public void onDisable() {
        getLogger().info("ZephyrusPlugin disabled.");
    }

    public static ZephyrusPlugin getInstance() { return instance; }
    public String getApiUrl() { return apiUrl; }
    public String getPluginSecret() { return pluginSecret; }
}
