local json = require("json")

if not members then
   members = {}
end

if not x_ids then
   x_ids = {}
end

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

Handlers.add(
   "join",
   Handlers.utils.hasMatchingTag("Action", "Join"),
   function (msg)
      assert(msg.From == join, 'only join process can execute!')
      assert(type(msg.Tags.X) == 'string', 'X is required!')
      assert(type(msg.Tags.Address) == 'string', 'Address is required!')
      assert(type(msg.Tags.Profile) == 'string', 'Profile is required!')
      assert(members[msg.Tags.Address] == nil, 'already a member!')
      assert(x_ids[msg.Tags.X] == nil, 'X already used!')
      members[msg.Tags.Address] = { x = msg.Tags.X, profile = msg.Tags.Profile }
      x_ids[msg.Tags.X] = msg.Tags.Address
      local qty = 200000000
      assert(balances[ao.id] >= qty, 'not enough token left!'..qty..":"..balances[ao.id]..":"..ao.id)
      local addr = msg.Tags.Address
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
   end
)
