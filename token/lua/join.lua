candidates = candidates or {}
vouchDAO = "ZTTO02BL2P-lseTLUgiIPD9d0CF1sc4LbMA2AQ7e9jo"
aoProfile = "SNy4m-DrqxWl01YqGM4sxI8qCni-58re8uuJLvZPypY"
token = "XIIKBUWmBoTlZAkK3kD216OwlM50hRj6VKSYB65O9tA"

function isValidAddr(address)
   return string.match(address, "^[A-Za-z0-9_-]+$") ~= nil and #address == 43
end

Handlers.add(
   "joined",
   Handlers.utils.hasMatchingTag("Action", "Joined"),
   function (msg)
      assert(msg.From == token, "not from Token")
      local addr = msg.Tags.Address
      assert(type(addr) == "string", "Address required!")
      assert(type(candidates[addr]) == "table", "not requested!")
      assert(candidates[addr].joined ~= true, "already joined!")
      candidates[addr].joined = true
   end
)

Handlers.add(
   "verify",
   Handlers.utils.hasMatchingTag("Action", "Verify"),
   function (msg)
      assert(msg.From == ao.id or msg.From == ao.env.Process.Owner, 'only process or owner can execute!')
      local addr = msg.Tags.ID
      local referral = msg.Tags.Referral
      assert(type(addr) == "string" and isValidAddr(addr), "invalid address!")
      assert(type(msg.Tags["X-ID"]) == "string", "X-ID is required!")
      assert(type(msg.Tags["X-Username"]) == "string", "X-Username is required!")
      candidates[addr] = candidates[addr] or {}
      assert(candidates[addr].joined ~= true, "already joined!")
      candidates[addr].x_id = msg.Tags["X-ID"]
      candidates[addr].x_username = string.lower(msg.Tags["X-Username"])
      
      if type(referral) == "string" and isValidAddr(referral) then
	 assert(referral ~= addr, "referral cannot be address!")
	 assert(type(candidates[referral]) == "table" and candidates[referral].joined, "referral has not been joined!")
	 candidates[addr].referral = referral
      end
      
      if candidates[addr].x == nil then
	 Send({Target = vouchDAO, Action = "Get-Vouches", Tags = { ID = msg.Tags.ID }})
      end
      if candidates[addr].profile == nil then
	 Send({Target = aoProfile, Action = "Get-Profiles-By-Delegate", Data = require("json").encode({ Address = addr })})
      end
      
      if candidates[addr].profile ~= nil and candidates[addr].x ~= nil then
	 local new_msg = { Target = token, Tags = { Action = "Join", Address = addr, Profile = candidates[addr].profile, X = candidates[addr].x_id }}
	 if type(candidates[addr].referral) == "string" then
	    new_msg.Tags.Referral = candidates[addr].referral
	 end
	 Send(new_msg)
      end
   end
)


Handlers.add(
   "vouchdao.vouches",
   Handlers.utils.hasMatchingTag("Action", "VouchDAO.Vouches"),
   function (msg)
      assert(msg.From == vouchDAO, "not from VouchDAO!")
      local data = require('json').decode(msg.Data)
      local addr = data["Vouches-For"]
      assert(type(addr) == "string", "no data")
      assert(type(candidates[addr]) == "table", "not requested!")
      assert(candidates[addr].joined ~= true, "already joined!")
      local vouched = data.Vouchers["Ax_uXyLQBPZSQ15movzv9-O1mDo30khslqN64qD27Z8"]
      assert(type(vouched) == "table", "not vouched!")
      local value = tonumber(string.match(vouched.Value, "^[^%-]+"))
      assert(value > 0, "score 0")
      local username = string.lower(vouched.Identifier)
      assert(username == candidates[addr].x_username, "wrong x username!")
      candidates[addr].x = string.lower(vouched.Identifier)
      Send({ Target = ao.id, Tags = { Action = "Got-Vouches", Address = addr, Score = vouched.Value }})
      if candidates[addr].profile ~= nil and candidates[addr].x ~= nil then
	 local new_msg = { Target = token, Tags = { Action = "Join", Address = addr, Profile = candidates[addr].profile, X = candidates[addr].x_id }}
	 if type(candidates[addr].referral) == "string" then
	    new_msg.Tags.Referral = candidates[addr].referral
	 end
	 Send(new_msg)
      end
   end
)

Handlers.add(
   "Profile-Success",
   Handlers.utils.hasMatchingTag("Action", "Profile-Success"),
   function (msg)
      assert(msg.From == aoProfile, "not from AO Profile!")
      local data = require('json').decode(msg.Data)
      local addr = data[1].CallerAddress
      assert(type(candidates[addr]) == "table", "not requested!")
      assert(candidates[addr].joined ~= true, "already joined!")
      candidates[addr] = candidates[addr] or {}
      candidates[addr].profile = data[1].ProfileId
      Send({ Target = ao.id, Tags = { Action = "Got-Profile" }, Data = msg.Data })
      if candidates[addr].profile ~= nil and candidates[addr].x ~= nil then
	 local new_msg = { Target = token, Tags = { Action = "Join", Address = addr, Profile = candidates[addr].profile, X = candidates[addr].x_id }}
	 if type(candidates[addr].referral) == "string" then
	    new_msg.Tags.Referral = candidates[addr].referral
	 end
	 Send(new_msg)
      end
   end
)
