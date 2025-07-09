// test-insertMultipleClients.js
require('dotenv').config()

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

;(async () => {
  try {
    const cantidad = 50
    const createdClients = []

    for (let i = 1; i <= cantidad; i++) {
      const datos = {
        nombre: `ClientePrueba${i}`,
        celular: `+519000000${String(i).padStart(2, '0')}`, // +51900000001, +51900000002, …
        gestor:  'test'
        // añade aquí otros campos NOT NULL si los tienes…
      }

      const cliente = await prisma.cliente.create({ data: datos })
      console.log(`✅ [${i}/${cantidad}] Cliente insertado:`, cliente.cliente_id)
      createdClients.push(cliente)
    }

    console.log(`\n🎉 Se insertaron ${createdClients.length} clientes correctamente.`)

    // --- limpieza opcional: descomenta si quieres borrar todo al final ---
    /*
    for (const c of createdClients) {
      await prisma.cliente.delete({ where: { cliente_id: c.cliente_id } })
      console.log(`🗑️ Cliente borrado: ${c.cliente_id}`)
    }
    console.log('🗑️ Cleanup completo.')
    */

  } catch (error) {
    console.error('❌ Error en insert-test:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
})()
