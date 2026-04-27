package ru.zephyrus.commands;

import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import ru.zephyrus.ApiClient;
import ru.zephyrus.ZephyrusPlugin;
import ru.zephyrus.listeners.InventoryListener;

import java.util.List;

public class ChestCommand implements CommandExecutor {

    private final ZephyrusPlugin plugin;
    private final ApiClient api;

    public ChestCommand(ZephyrusPlugin plugin) {
        this.plugin = plugin;
        this.api = new ApiClient(plugin);
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("§cТолько игрок может использовать эту команду.");
            return true;
        }

        String mcUuid = player.getUniqueId().toString();
        player.sendMessage("§7Загружаем инвентарь...");

        api.get("/api/plugin/inventory/" + mcUuid,
            response -> {
                if (!response.contains("\"success\":true")) {
                    String err = extractField(response, "message");
                    player.sendMessage("§c✗ " + err);
                    return;
                }

                // Parse unlocked_slots
                int unlocked = parseIntField(response, "unlocked_slots");

                // Build inventory (6 rows = 54 slots)
                Inventory inv = Bukkit.createInventory(null, 54, "§8☁ §rОблачный инвентарь");

                // Fill locked slots with gray glass
                ItemStack locked = new ItemStack(Material.GRAY_STAINED_GLASS_PANE);
                ItemMeta meta = locked.getItemMeta();
                meta.setDisplayName("§8Заблокировано");
                meta.setLore(List.of("§7Разблокируйте на сайте Zephyrus"));
                locked.setItemMeta(meta);
                for (int i = unlocked; i < 54; i++) inv.setItem(i, locked);

                // Parse items array
                int itemsStart = response.indexOf("\"items\":[");
                if (itemsStart != -1) {
                    String itemsSection = response.substring(itemsStart + 9);
                    // Simple JSON array parsing
                    String[] entries = itemsSection.split("\\},\\{");
                    for (String entry : entries) {
                        if (!entry.contains("slot")) continue;
                        int slot = parseIntField(entry, "slot");
                        String itemType = extractField(entry, "item_type");
                        int count = parseIntField(entry, "item_count");
                        String itemName = extractField(entry, "item_name");

                        Material mat = parseMaterial(itemType);
                        if (mat == null) mat = Material.BARRIER;

                        ItemStack item = new ItemStack(mat, Math.max(1, count));
                        ItemMeta im = item.getItemMeta();
                        if (im != null) {
                            im.setDisplayName("§f" + itemName);
                            im.setLore(List.of("§7Слот: " + slot, "§7Количество: " + count));
                            item.setItemMeta(im);
                        }
                        if (slot >= 0 && slot < unlocked) inv.setItem(slot, item);
                    }
                }

                player.openInventory(inv);
                InventoryListener.registerOpen(player.getUniqueId(), mcUuid, unlocked);
            },
            error -> player.sendMessage("§c✗ Ошибка (" + plugin.getApiUrl() + "): " + error)
        );

        return true;
    }

    private String extractField(String json, String field) {
        int idx = json.indexOf("\"" + field + "\":\"");
        if (idx == -1) return "";
        int start = idx + field.length() + 4;
        int end = json.indexOf("\"", start);
        return end > start ? json.substring(start, end) : "";
    }

    private int parseIntField(String json, String field) {
        int idx = json.indexOf("\"" + field + "\":");
        if (idx == -1) return 0;
        int start = idx + field.length() + 3;
        int end = start;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) end++;
        try { return Integer.parseInt(json.substring(start, end)); } catch (Exception e) { return 0; }
    }

    private Material parseMaterial(String itemType) {
        if (itemType == null || itemType.isEmpty()) return Material.BARRIER;
        String name = itemType.replace("minecraft:", "").toUpperCase().replace(":", "_");
        try { return Material.valueOf(name); } catch (Exception e) { return null; }
    }
}
