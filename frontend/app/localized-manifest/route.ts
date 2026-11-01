import manifest from "../manifest";
import { dictionaries, normalizeLocale } from "@/lib/locale";

export function GET(request: Request) {
  const locale = normalizeLocale(new URL(request.url).searchParams.get("lang"));
  return Response.json({
    ...manifest(),
    name: dictionaries[locale]["app.title"],
    description: dictionaries[locale]["app.description"],
    lang: locale,
  }, {headers: {"Content-Type":"application/manifest+json", "Cache-Control":"public, max-age=3600"}});
}
