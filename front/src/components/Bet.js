import React, { Component } from 'react'

import BetJson from '../build/contracts/Bet.json'
import getWeb3 from '../utils/getWeb3'

class Bet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bet_state: '',
      is_featured: false,
      title: '',
      category: '',
      team_0: '',
      team_1: '',
      team_0_bet_sum: 0,
      team_1_bet_sum: 0,
      bets_to_team_0: {},
      bets_to_team_1: {},
      timestamp_match_begin: 0,
      timestamp_match_end: 0,
      timestamp_hard_deadline: 0,
      timestamp_terminate_deadline: 0,
      url_oraclize: '',
      web3: null, // TODO: REMOVE WEB3, DO STATIC
    }
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

      // Instantiate contract once web3 provided.
      this.instantiateContract();
    })
    .catch((err) => {
      console.log('Error finding web3', err);
    })
  }

  instantiateContract() {
    var self = this;
    var objs = {};
    function setAttributes(attributeNames, contractInstance) {
      var promises = Object.keys(attributeNames).map(async (attr) => {
        if (attr !== 'web3' // FIXME: REMOVE ONCE WEB3 IS NOT HERE
            && attr !== 'bets_to_team_0' // Cannot get mapping keys, no prob: get from events
            && attr !== 'bets_to_team_1') { // idem

          var res = await betContractInstance[attr]();
          if (typeof res === 'object') // Handle BigNumber
            res = res.toNumber();
          else
            res = res.toString();
          objs[attr] = res;
          // self.setState(obj);
        }
      });
      Promise.all(promises).then(res => {
        self.setState(objs);
      })
    }

    const contract = require('truffle-contract');
    const betContract = contract(BetJson);
    betContract.setProvider(this.state.web3.currentProvider);

    // Declaring this for later so we can chain functions on SimpleStorage.
    var betContractInstance = betContract.at(this.props.address);
    setAttributes(this.state, betContractInstance);


    var betEvents = betContractInstance.new_bet({fromBlock: 0, toBlock: 'latest'});
    console.log(betEvents);
    betEvents.watch((error, response) => {
      console.log('Bet:', response.args);
      if (response.args.for_team === false)
        this.setState({ team_0_bet_sum : this.state.team_0_bet_sum + response.args.amount.toNumber() });
      else
        this.setState({ team_1_bet_sum : this.state.team_1_bet_sum + response.args.amount.toNumber() });
    });
  }

  render() {
    var teams = this.state.title.split('x');
    const listClass = `list-item card list`;
    console.log('Props', this.props);
    return (
      <li key={this.props.address} className={listClass}>
        <span>
          <div className='team0'>
            <h3>{teams[0]} </h3>
          </div>
          <div className='team1'>
            <h3>{teams[1]} </h3>
          </div>

          Addr: {this.props.address} <br/>
          State: {this.state.bet_state} <br />
          Featured: {this.state.is_featured} <br />
          Team0 {this.state.team_0}: ${this.state.team_0_bet_sum} <br/>
          Team1 {this.state.team_1}: ${this.state.team_1_bet_sum} <br/>
          Category: {this.state.category} <br/>
          Begins: {this.state.timestamp_match_begin} <br/>
          Ends: {this.state.timestamp_match_end} <br/>
          Hard Deadline: {this.state.timestamp_hard_deadline} <br/>
          Terminate Deadline: {this.state.timestamp_terminate_deadline} <br/>
          Oracle: {this.state.url_oraclize}
        </span>
      </li>
    );
  }
}

export default Bet;