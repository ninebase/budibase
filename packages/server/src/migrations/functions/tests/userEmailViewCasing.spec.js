const TestConfig = require("../../../tests/utilities/TestConfiguration")
const { TENANT_ID } = require("../../../tests/utilities/structures")
const { getGlobalDB, doInTenant } = require("@budibase/backend-core/tenancy")

// mock email view creation
const coreDb = require("@budibase/backend-core/db")
const createNewUserEmailView = jest.fn()
coreDb.createNewUserEmailView = createNewUserEmailView

const migration = require("../userEmailViewCasing")

describe("run", () => {
    let config = new TestConfig(false)

    beforeEach(async () => {
      await config.init()
    })

    afterAll(config.end)

    it("runs successfully", async () => {
      await doInTenant(TENANT_ID, async () => {
        const globalDb = getGlobalDB()
        await migration.run(globalDb)
        expect(createNewUserEmailView).toHaveBeenCalledTimes(1)
      })
    })
})
