package com.zephyrus.paperauth.commands;

import org.bukkit.Material;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import com.zephyrus.paperauth.ApiClient;
import com.zephyrus.paperauth.PaperAuthCompanion;

public class ExchangeCommand implements CommandExecutor {

    private final PaperAuthCompanion plugin;
    private final ApiClient api;

    public ExchangeCommand(PaperAuthCompanion plugin) {
        this.plugin = plugin;
        this.api = new ApiClient(plugin);
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("§cТолько игрок может использовать эту команду.");
            return true;
        }

        int amount = 1;
        if (args.length > 0) {
            try {
                amount = Integer.parseInt(args[0]);
                if (amount < 1) throw new NumberFormatException();
            } catch (NumberFormatException e) {
                player.sendMessage("§cУкажите корректное количество алмазов. Пример: §e/exchange 5");
                return true;
            }
        }

        // Count diamonds in player inventory
        int diamondCount = 0;
        for (ItemStack item : player.getInventory().getContents()) {
            if (item != null && item.getType() == Material.DIAMOND) {
                diamondCount += item.getAmount();
            }
        }

        if (diamondCount < amount) {
            player.sendMessage(String.format(
                "§cНедостаточно алмазов! У вас: §e%d§c, нужно: §e%d§c.", diamondCount, amount
            ));
            return true;
        }

        // Remove diamonds from player inventory
        int toRemove = amount;
        for (ItemStack item : player.getInventory().getContents()) {
            if (item != null && item.getType() == Material.DIAMOND && toRemove > 0) {
                int take = Math.min(item.getAmount(), toRemove);
                item.setAmount(item.getAmount() - take);
                toRemove -= take;
            }
        }

        String mcUuid = player.getUniqueId().toString();
        final int finalAmount = amount;

        String json = String.format("{\"mc_uuid\":\"%s\",\"amount\":%d}", mcUuid, finalAmount);

        api.post("/api/plugin/diamond-to-zephyr", json,
            response -> {
                if (response.contains("\"success\":true")) {
                    int earned = finalAmount * 10;
                    player.sendMessage(String.format(
                        "§a✓ §e%d §7алмаз(а) обменяны на §b+%d Зефирок§7!", finalAmount, earned
                    ));
                } else {
                    // Refund diamonds if API failed
                    player.getInventory().addItem(new ItemStack(Material.DIAMOND, finalAmount));
                    player.sendMessage("§c✗ Ошибка при обмене. Алмазы возвращены.");
                }
            },
            error -> {
                // Refund diamonds on network error
                player.getInventory().addItem(new ItemStack(Material.DIAMOND, finalAmount));
                player.sendMessage("§c✗ Ошибка сети (" + plugin.getApiUrl() + "). Алмазы возвращены: " + error);
            }
        );

        return true;
    }
}
