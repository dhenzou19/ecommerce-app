import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    url: "postgresql://ecommerce_user:ecommerce_pass@localhost:5432/ecommerce_db"
  }
})