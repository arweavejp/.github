local json = require("json")
local crypto = require(".crypto");

if not balances then
   balances = { [ao.id] = 1000000000000000 }
end

if not vouchers then
   vouchers = { }
end

if not campaigns then
   campaigns = { }
end

if name ~= "Arweave Japan Test" then
   name = "Arweave Japan Test"
end

if ticker ~= "tAJ" then
   ticker = "tAJ"
end

if denomination ~= 6 then
   denomination = 6
end

Handlers.add(
   "campaign",
   Handlers.utils.hasMatchingTag("Action", "Campaign"),
   function (msg)
      assert(msg.From == ao.id, 'only process can execute!')
      assert(type(msg.Tags.Campaign) == 'string', 'Campaign is required!')
      assert(type(msg.Tags.Quantity) == 'string', 'Quantity is required!')
      if not campaigns[msg.Tags.Campaign] then
	 campaigns[msg.Tags.Campaign] = { state = 1 }
      end
      campaigns[msg.Tags.Campaign].quantity = msg.Tags.Quantity
      Handlers.utils.reply("campaign added")(msg)
   end
)

Handlers.add(
   "start-campaign",
   Handlers.utils.hasMatchingTag("Action", "Start-Campaign"),
   function (msg)
      assert(msg.From == ao.id, 'only process can execute!')
      assert(type(msg.Tags.Campaign) == 'string', 'Campaign is required!')
      assert(campaigns[msg.Tags.Campaign] ~= nil, 'Campaign does not exist!')
      assert(campaigns[msg.Tags.Campaign].state == 0, 'Campaign is ongoing!')
      campaigns[msg.Tags.Campaign].state = 1
      Handlers.utils.reply("campaign started")(msg)
   end
)

Handlers.add(
   "stop-campaign",
   Handlers.utils.hasMatchingTag("Action", "Stop-Campaign"),
   function (msg)
      assert(msg.From == ao.id, 'only process can execute!')
      assert(type(msg.Tags.Campaign) == 'string', 'Campaign is required!')
      assert(campaigns[msg.Tags.Campaign] ~= nil, 'Campaign does not exist!')
      assert(campaigns[msg.Tags.Campaign].state == 1, 'Campaign is not ongoing!')
      campaigns[msg.Tags.Campaign].state = 0
      Handlers.utils.reply("campaign stopped")(msg)
   end
)

Handlers.add(
   "request",
   Handlers.utils.hasMatchingTag("Action", "Request"),
   function (msg)
      assert(type(msg.Tags.Campaign) == 'string', 'Campaign is required!')
      assert(campaigns[msg.Tags.Campaign] ~= nil, 'Campaign does not exist!')
      assert(campaigns[msg.Tags.Campaign].state == 1, 'Campaign is not ongoing!')
      assert(type(msg.Tags.Signature) == 'string', 'Signature is required!')
      if not vouchers[msg.From] then
	 vouchers[msg.From] = {}
      end
      if vouchers[msg.From][msg.Tags.Campaign] then
	 assert(vouchers[msg.From][msg.Tags.Campaign].state ~= 3, 'state must not be 3')
      end
      if not vouchers[msg.From][msg.Tags.Campaign] then
	 vouchers[msg.From][msg.Tags.Campaign] = {}
      end
      vouchers[msg.From][msg.Tags.Campaign].state = 1
      Handlers.utils.reply("requested")(msg)
   end
)

Handlers.add(
   "get-request",
   Handlers.utils.hasMatchingTag("Action", "Get-Request"),
   function (msg)
      assert(type(msg.Tags.Campaign) == 'string', 'Campaign is required!')
      assert(type(msg.Tags.Target) == 'string', 'Target is required!')
      if not vouchers[msg.Tags.Target] or not vouchers[msg.Tags.Target][msg.Tags.Campaign] then
	 ao.send({Target = msg.From, Tags = {
		     Target = msg.Tags.Target,
		     Request = json.encode(nil),
	 }})
      else
	 ao.send({Target = msg.From, Tags = {
		     Target = msg.Tags.Target,
		     Request = json.encode(vouchers[msg.Tags.Target][msg.Tags.Campaign])
	 }})
      end
   end
)

Handlers.add(
   "issue",
   Handlers.utils.hasMatchingTag("Action", "Issue"),
   function (msg)
      assert(msg.From == ao.id, 'only process can execute!')
      assert(type(msg.Tags.Campaign) == 'string', 'Campaign is required!')
      assert(campaigns[msg.Tags.Campaign] ~= nil, 'Campaign does not exist!')
      assert(campaigns[msg.Tags.Campaign].state == 1, 'Campaign is not ongoing!')
      assert(type(msg.Tags.Recipient) == 'string', 'Recipient is required!')
      assert(type(msg.Tags.Code) == 'string', 'Code is required!')
      assert(vouchers[msg.Tags.Recipient][msg.Tags.Campaign].state == 1, 'state must be 1')
      vouchers[msg.Tags.Recipient][msg.Tags.Campaign].code = msg.Tags.Code
      vouchers[msg.Tags.Recipient][msg.Tags.Campaign].state = 2
      Handlers.utils.reply("issued")(msg)
   end
)

Handlers.add(
   "claim",
   Handlers.utils.hasMatchingTag("Action", "Claim"),
   function (msg)
      assert(type(msg.Tags.Campaign) == 'string', 'Campaign is required!')
      assert(campaigns[msg.Tags.Campaign] ~= nil, 'Campaign does not exist!')
      assert(campaigns[msg.Tags.Campaign].state == 1, 'Campaign is not ongoing!')
      assert(type(msg.Tags.Key) == 'string', 'Key is required!')
      assert(vouchers[msg.From][msg.Tags.Campaign].state == 2, 'state must be 2')
      local hash = crypto.digest.keccak256(msg.Tags.Key).asHex()
      assert(hash == vouchers[msg.From][msg.Tags.Campaign].code, 'The wrong Key!')
      local qty = tonumber(campaigns[msg.Tags.Campaign].quantity)
      assert(balances[ao.id] >= qty, 'not enough token left!'..qty..":"..balances[ao.id]..":"..ao.id)	 
      if not balances[msg.From] then
	 balances[msg.From] = 0
      end
      balances[ao.id] = balances[ao.id] - qty
      balances[msg.From] = balances[msg.From] + qty
      vouchers[msg.From][msg.Tags.Campaign].state = 3
      vouchers[msg.From][msg.Tags.Campaign].code = nil
      ao.send({
	    Target = msg.From,
	    Tags = {
	       Action = "Credit-Notice",
	       Quantity = tostring(qty)
      }})
      Handlers.utils.reply("claimed")(msg)
   end
)

Handlers.add(
   "transfer",
   Handlers.utils.hasMatchingTag("Action", "Transfer"),
   function (msg)
      assert(type(msg.Tags.Recipient) == 'string', 'Recipient is required!')
      assert(type(msg.Tags.Quantity) == 'string', 'Quantity is required!')

      if not balances[msg.From] then
	 balances[msg.From] = 0
      end

      if not balances[msg.Tags.Recipient] then
	 balances[msg.Tags.Recipient] = 0
      end

      local qty = tonumber(msg.Tags.Quantity)
      assert(type(qty) == 'number', 'qty must be number')
 
      if balances[msg.From] >= qty then
	 balances[msg.From] = balances[msg.From] - qty
	 balances[msg.Tags.Recipient] = balances[msg.Tags.Recipient] + qty
	 ao.send({
	       Target = msg.From,
	       Tags = {
		  Action = "Debit-Notice",
		  Quantity = tostring(qty)
	       }
	 })
	 ao.send({
	       Target = msg.Tags.Recipient,
	       Tags = {
		  Action = "Credit-Notice",
		  Quantity = tostring(qty)
	 }})

      end
   end
)

Handlers.add(
   "balance",
   Handlers.utils.hasMatchingTag("Action", "Balance"),
   function (msg)
      assert(type(msg.Tags.Target) == "string", "Target Tag is required!")
      local bal = "0"
      if balances[msg.Tags.Target] then
	 bal = tostring(balances[msg.Tags.Target])
      end
      ao.send({Target = msg.From, Tags = {
		  Target = msg.From,
		  Balance = bal,
		  Ticker = ticker or ""
      }})
   end
)

Handlers.add(
   "balances",
   Handlers.utils.hasMatchingTag("Action", "Balances"),
   function (msg)
      ao.send({
	    Target = msg.From,
	    Data = json.encode(balances)
      })
   end

)

Handlers.add(
   "info",
   Handlers.utils.hasMatchingTag("Action", "Info"),
   function (msg)
      ao.send({Target = msg.From, Tags = {
		  Name = name,
		  Ticker = ticker,
		  Denomination = tostring(denomination)
      }})
   end
)
