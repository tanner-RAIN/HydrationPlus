# Connection Checklist

Current account details collected:

- Site URL: `https://responsiblyrain.com/`
- GA4 Property ID: `150934287`
- GA4 Measurement ID: `G-TTWYSKCH95`
- Search Console property: `https://responsiblyrain.com/`
- Meta Business ID: `323091345184261`
- Amazon region: `US`
- Amazon Ads: `yes`

## Still needed for first connector batch

### Shopify

- `SHOPIFY_MYSHOPIFY_DOMAIN`
  - This is usually something like `brand-name.myshopify.com`.
  - The Admin API typically uses the `.myshopify.com` domain, not only the public custom domain.
- `SHOPIFY_ADMIN_ACCESS_TOKEN`
  - Create a custom app in Shopify Admin and grant read access for orders, products, inventory, and analytics/reporting fields you want surfaced.

### Meta

- `META_AD_ACCOUNT_ID`
  - This should be the ad account ID, typically used as `act_<id>`.
  - The value `323091345184261` looks like a Business Manager ID, not an ad account ID.
- `META_FACEBOOK_PAGE_ID`
- `META_INSTAGRAM_ACCOUNT_ID`
  - Must be the connected Instagram business account for insights/ad joins.
- `META_APP_ID`
- `META_APP_SECRET`
- `META_ACCESS_TOKEN`

### Google

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

These can support both GA4 and Search Console if you use one Google Cloud OAuth app.

### Amazon SP-API

- `AMAZON_MARKETPLACE_ID`
  - For US, this is commonly `ATVPDKIKX0DER`.
- `AMAZON_LWA_CLIENT_ID`
- `AMAZON_LWA_CLIENT_SECRET`
- `AMAZON_REFRESH_TOKEN`
- `AMAZON_AWS_ACCESS_KEY_ID`
- `AMAZON_AWS_SECRET_ACCESS_KEY`
- `AMAZON_ROLE_ARN`

### Amazon Ads

- `AMAZON_ADS_PROFILE_ID`
- `AMAZON_ADS_CLIENT_ID`
- `AMAZON_ADS_CLIENT_SECRET`
- `AMAZON_ADS_REFRESH_TOKEN`

## Immediate cautions

- Do not paste secrets into chat if you can avoid it. Put them into a local `.env` file based on `.env.example`.
- Shopify likely needs the `.myshopify.com` domain in addition to `responsiblyrain.com`.
- Meta Business ID and Meta Ad Account ID are different objects. We need the actual ad account ID.

## Best next sequence

1. Fill the Google OAuth values so GA4 and Search Console can be connected together.
2. Fill the Shopify custom app token and `.myshopify.com` domain.
3. Replace the Meta ad account placeholder with the actual ad account ID and add page/Instagram IDs.
4. Add Amazon SP-API and Amazon Ads credentials after that.
