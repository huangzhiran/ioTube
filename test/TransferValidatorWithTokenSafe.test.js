const TokenSafe = artifacts.require('TokenSafe');
const TransferValidatorWithTokenSafe = artifacts.require('TransferValidatorWithTokenSafe');
const TokenList = artifacts.require('TokenList');
const ShadowToken = artifacts.require('ShadowToken');
const WitnessList = artifacts.require('WitnessList');
const {assertAsyncThrows} = require('./assert-async-throws');

contract('TransferValidatorWithTokenSafe', function([owner, minter, sender, receiver, witness1, witness2, witness3, witness4, fakeTokenAddress]) {
    beforeEach(async function() {
        this.tokenSafe = await TokenSafe.new();
        // use shadow token as standard erc20 token
        this.shadowToken = await ShadowToken.new(minter, fakeTokenAddress, "name", "symbol");
        await this.shadowToken.mint(this.tokenSafe.address, 100000000, {from: minter});
        this.tokenList = await TokenList.new();
        this.witnessList = await WitnessList.new();
        this.validator = await TransferValidatorWithTokenSafe.new(10, this.tokenSafe.address, this.tokenList.address, this.witnessList.address);
        await this.tokenSafe.transferOwnership(this.validator.address);
    });
    it('witness not in list', async function() {
        await assertAsyncThrows(this.validator.submit(this.shadowToken.address, 0, sender, receiver, 12345, {from: witness1}));
    });
    it('token not in list', async function() {
        await this.witnessList.addWitness(witness1);
        await assertAsyncThrows(this.validator.submit(this.shadowToken.address, 0, sender, receiver, 12345, {from: witness1}));
    });
    it('one witness', async function() {
        await this.witnessList.addWitness(witness1);
        await this.tokenList.addToken(this.shadowToken.address, 1, 100000);
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), false);
        await this.validator.submit(this.shadowToken.address, 0, sender, receiver, 12345, {from: witness1});
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), true);
        assert.equal(await this.shadowToken.balanceOf(receiver), 12345);
        assert.equal(await this.shadowToken.balanceOf(this.tokenSafe.address), 99987655);
    });
    it('two witnesss', async function() {
        await this.witnessList.addWitness(witness1);
        await this.witnessList.addWitness(witness2);
        await this.tokenList.addToken(this.shadowToken.address, 1, 100000);
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), false);
        await this.validator.submit(this.shadowToken.address, 0, sender, receiver, 12345, {from: witness1});
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), false);
        await this.validator.submit(this.shadowToken.address, 0, sender, receiver, 12345, {from: witness2});
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), true);
        assert.equal(await this.shadowToken.balanceOf(receiver), 12345);
        assert.equal(await this.shadowToken.balanceOf(this.tokenSafe.address), 99987655);
    });
    it('three witnesss', async function() {
        await this.witnessList.addWitness(witness1);
        await this.witnessList.addWitness(witness2);
        await this.witnessList.addWitness(witness3);
        await this.tokenList.addToken(this.shadowToken.address, 1, 100000);
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), false);
        await this.validator.submit(this.shadowToken.address, 0, sender, receiver, 12345, {from: witness1});
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), false);
        await this.validator.submit(this.shadowToken.address, 0, sender, receiver, 12345, {from: witness2});
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), false);
        await this.validator.submit(this.shadowToken.address, 0, sender, receiver, 12345, {from: witness3});
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), true);
        assert.equal(await this.shadowToken.balanceOf(receiver), 12345);
        assert.equal(await this.shadowToken.balanceOf(this.tokenSafe.address), 99987655);
    });
    it('four witnesss', async function() {
        await this.witnessList.addWitness(witness1);
        await this.witnessList.addWitness(witness2);
        await this.witnessList.addWitness(witness3);
        await this.witnessList.addWitness(witness4);
        await this.tokenList.addToken(this.shadowToken.address, 1, 100000);
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), false);
        await this.validator.submit(this.shadowToken.address, 0, sender, receiver, 12345, {from: witness1});
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), false);
        await this.validator.submit(this.shadowToken.address, 0, sender, receiver, 12345, {from: witness2});
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), false);
        await this.validator.submit(this.shadowToken.address, 0, sender, receiver, 12345, {from: witness3});
        assert.equal(await this.validator.settled(this.shadowToken.address, 0, sender, receiver, 12345), true);
        await this.validator.submit(this.shadowToken.address, 0, sender, receiver, 12345, {from: witness4});
        assert.equal(await this.shadowToken.balanceOf(receiver), 12345);
        assert.equal(await this.shadowToken.balanceOf(this.tokenSafe.address), 99987655);
    });
    it('upgrade', async function() {
        assert.equal(await this.tokenSafe.owner(), this.validator.address);
        await assertAsyncThrows(this.validator.upgrade(owner, {from: sender}));
        assert.equal(await this.tokenSafe.owner(), this.validator.address);
        await this.validator.upgrade(owner);
        assert.equal(await this.tokenSafe.owner(), owner);
    });
});