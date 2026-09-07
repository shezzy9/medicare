import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Temporary shell rendered by routes whose page body is built by a later page
 * task. Keeps the app navigable and compiling until the real page lands.
 */
export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-muted-foreground">
            This module is being set up. It will be available shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
