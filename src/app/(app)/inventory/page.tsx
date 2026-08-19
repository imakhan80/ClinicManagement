import { PackageSearch, History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-profile";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { NewItemDialog } from "@/components/inventory/new-item-dialog";
import { AdjustStockDialog } from "@/components/inventory/adjust-stock-dialog";
import { formatCurrency, formatRelative } from "@/lib/format";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const canAdjust = user?.role === "admin" || user?.role === "nurse" || user?.role === "doctor";

  const [{ data: items }, { data: recentMovements }] = await Promise.all([
    supabase.from("inventory_items").select("*").order("name"),
    supabase
      .from("inventory_movements")
      .select("id, change_qty, reason, note, created_at, inventory_items(name), created_by:profiles!created_by(full_name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory"
        description="Track clinical supplies and equipment stock, separate from the pharmacy."
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Supply stock</h2>
          {user?.role === "admin" && <NewItemDialog />}
        </div>
        {!items || items.length === 0 ? (
          <EmptyState icon={PackageSearch} title="No inventory items yet" />
        ) : (
          <Card className="gap-0 overflow-hidden p-0 shadow-sm">
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[item.category, item.unit].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">
                        {formatCurrency(Number(item.unit_cost))}
                      </p>
                      <p
                        className={`text-xs tabular-nums ${
                          item.stock_quantity <= item.reorder_level
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.stock_quantity} in stock
                      </p>
                    </div>
                    {canAdjust && <AdjustStockDialog itemId={item.id} itemName={item.name} />}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {recentMovements && recentMovements.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
            <History className="size-4" />
            Recent stock movements
          </h2>
          <Card className="gap-0 overflow-hidden p-0 shadow-sm">
            <ul className="divide-y divide-border">
              {recentMovements.map((m) => {
                const item = Array.isArray(m.inventory_items) ? m.inventory_items[0] : m.inventory_items;
                const staff = Array.isArray(m.created_by) ? m.created_by[0] : m.created_by;
                return (
                  <li key={m.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                    <span>
                      {item?.name} {m.change_qty > 0 ? "+" : ""}
                      {m.change_qty}
                      <span className="text-xs text-muted-foreground"> · {m.reason.replace("_", " ")}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {staff?.full_name ? `${staff.full_name} · ` : ""}
                      {formatRelative(m.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
