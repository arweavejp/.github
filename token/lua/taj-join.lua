local json = require("json")

ref = ref or 0
referrals = referrals or {}
members = members or {}
x_ids = x_ids or {}

join = "7iHLISwhaAQhx9lvuKXWix-Q5NM5CnijzEdNsXpn51w"

Handlers.add(
   "members",
   Handlers.utils.hasMatchingTag("Action", "Members"),
   function (msg)
      ao.send({
	    Target = msg.From,
	    Data = json.encode(members)
      })
   end

)

function isValidAddr(address)
   return string.match(address, "^[A-Za-z0-9_-]+$") ~= nil and #address == 43
end

Handlers.add(
   "join",
   Handlers.utils.hasMatchingTag("Action", "Join"),
   function (msg)
      assert(msg.From == join, 'only join process can execute!')
      assert(type(msg.Tags.X) == 'string', 'X is required!')
      assert(type(msg.Tags.Profile) == 'string', 'Profile is required!')
      local addr = msg.Tags.Address
      assert(type(addr) == "string" and isValidAddr(addr), "invalid address!")
      assert(members[addr] == nil, 'already a member!')
      assert(x_ids[msg.Tags.X] == nil, 'X already used!')
      local qty = 200000000
      local qty_ref = 0
      if type(msg.Tags.Referral) == "string" and referrals[msg.Tags.Referral] ~= nil and msg.Tags.Referral ~= addr then
	 qty_ref = 10000000
      end
      assert(balances[ao.id] >= qty + qty_ref, 'not enough token left!'..(qty + qty_ref)..":"..balances[ao.id]..":"..ao.id)

      members[addr] = { x = msg.Tags.X, profile = msg.Tags.Profile }
      x_ids[msg.Tags.X] = msg.Tags.Address
      
      if not balances[addr] then
	 balances[addr] = 0
      end
      
      balances[ao.id] = balances[ao.id] - qty
      balances[addr] = balances[addr] + qty
      ao.send({
	       Target = addr,
	       Tags = {
		  Action = "Credit-Notice",
		  Quantity = tostring(qty)
      }})
      ao.send({
	    Target = msg.From,
	    Tags = {
	       Action = "Joined",
	       Address = addr 
      }})
      if qty_ref > 0 then
	 local referral = msg.Tags.Referral
	 if not balances[referral] then
	    balances[referral] = 0
	 end
	 balances[ao.id] = balances[ao.id] - qty_ref
	 balances[referral] = balances[referral] + qty_ref
	 members[addr].referral = referral
	 table.insert(referrals[referral].refs, referral)
	 ao.send({
	       Target = referral,
	       Tags = {
		  Action = "Credit-Notice",
		  Quantity = tostring(qty_ref)
      }})
      end
   end
)

Handlers.add(
   "generate-refarral",
   Handlers.utils.hasMatchingTag("Action", "Generate-Referral"),
   function (msg)
      assert(msg.From == ao.id or msg.From == ao.env.Process.Owner, 'only process or owner can execute!')
      local addr = msg.Tags.Address
      assert(type(addr) == 'string', 'Address is required!')
      assert(type(addr) == "string" and isValidAddr(addr), "invalid address!")
      assert(referrals[addr] == nil, 'already exists!')
      assert(type(members[addr]) == "table", "not a member!")
      ref = ref + 1
      referrals[addr] = { id = ref, refs = {} }
      Handlers.utils.reply("referral generaged")(msg)
   end

)

Handlers.add(
   "get-refarral",
   Handlers.utils.hasMatchingTag("Action", "Get-Referral"),
   function (msg)
      local addr = msg.Tags.Address
      assert(type(addr) == 'string', 'Address is required!')
      assert(type(addr) == "string" and isValidAddr(addr), "invalid address!")
      assert(referrals[msg.Tags.Address] ~= nil, 'referral does not exist!')
      ao.send({
	    Target = msg.From,
	    Data = json.encode(referrals[addr])
      })
   end

)

function findReferralById(id)
    for key, referral in pairs(referrals) do
        if referral.id == id then
            return key, referral
        end
    end
    return nil, nil
end

Handlers.add(
   "get-refarral-by-id",
   Handlers.utils.hasMatchingTag("Action", "Get-Referral-By-Id"),
   function (msg)
      local id = msg.Tags.ID
      assert(type(id) == 'string', 'ID is required!')
      local addr, ref = findReferralById(tonumber(id))
      assert(addr ~= nil, 'referral does not exist!')
      ao.send({
	    Target = msg.From,
	    Data = json.encode({ address = addr, referral = ref })
      })
   end

)
