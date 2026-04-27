package ru.zephyrus.listeners;

import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.inventory.ItemStack;
import ru.zephyrus.ApiClient;
import ru.zephyrus.ZephyrusPlugin;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class InventoryListener implements Listener {

    private final ZephyrusPlugin plugin;
    private final ApiClient api;

    // Track open cloud inventories: player UUID -> mc_uuid + unlocked slots
    private static final Map<UUID, OpenInventoryData> openInventories = new HashMap<>();

    public InventoryListener(ZephyrusPlugin plugin) {
        this.plugin = plugin;
        this.api = new ApiClient(plugin);
    }

    public static void registerOpen(UUID playerUuid, String mcUuid, int unlockedSlots) {
        openInventories.put(playerUuid, new OpenInventoryData(mcUuid, unlockedSlots));
    }

    @EventHandler
    public void onInventoryClick(InventoryClickEvent event) {
        if (!(event.getWhoClicked() instanceof Player player)) return;
        if (!openInventories.containsKey(player.getUniqueId())) return;

        // Prevent clicking on locked slots (gray glass panes)
        ItemStack clicked = event.getCurrentItem();
        if (clicked != null && clicked.getType() == Material.GRAY_STAINED_GLASS_PANE) {
            event.setCancelled(true);
            player.sendMessage("§7Этот слот заблокирован. Разблокируйте его на сайте Zephyrus.");
        }
    }

    @EventHandler
    public void onInventoryClose(InventoryCloseEvent event) {
        if (!(event.getPlayer() instanceof Player player)) return;
        OpenInventoryData data = openInventories.remove(player.getUniqueId());
        if (data == null) return;

        // Check inventory title to confirm it's our cloud chest
        if (!event.getView().getTitle().contains("Облачный инвентарь")) return;

        // Sync changes back to server: deposit items placed by player
        for (int slot = 0; slot < data.unlockedSlots(); slot++) {
            ItemStack item = event.getInventory().getItem(slot);
            if (item == null || item.getType() == Material.AIR
                    || item.getType() == Material.GRAY_STAINED_GLASS_PANE) continue;

            // Only deposit items that the player manually placed (we can't easily track this
            // without per-slot state, so we deposit everything in the unlocked area)
            String itemType = "minecraft:" + item.getType().name().toLowerCase();
            String itemName = item.hasItemMeta() && item.getItemMeta().hasDisplayName()
                ? item.getItemMeta().getDisplayName().replace("§f", "")
                : item.getType().name();
            int count = item.getAmount();
            final int finalSlot = slot;

            String json = String.format(
                "{\"mc_uuid\":\"%s\",\"item_type\":\"%s\",\"item_count\":%d,\"item_name\":\"%s\"}",
                data.mcUuid(), itemType, count, itemName
            );

            api.post("/api/plugin/deposit-item", json,
                response -> {
                    if (!response.contains("\"success\":true")) {
                        player.sendMessage("§cОшибка при сохранении предмета в слоте " + finalSlot);
                    }
                },
                error -> player.sendMessage("§cОшибка сети при сохранении инвентаря: " + error)
            );
        }
    }

    record OpenInventoryData(String mcUuid, int unlockedSlots) {}
}
