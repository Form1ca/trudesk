/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    4/1/19 1:56 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { without, uniq } from 'lodash'

import { fetchTickets, unloadTickets, ticketUpdated } from 'actions/tickets'
import { showModal } from 'actions/common'

import PageTitle from 'components/PageTitle'
import Table from 'components/Table'
import TableHeader from 'components/Table/TableHeader'
import TableRow from 'components/Table/TableRow'
import TitlePagination from 'components/TitlePagination'
import PageContent from 'components/PageContent'
import TableCell from 'components/Table/TableCell'
import PageTitleButton from 'components/PageTitleButton'
import DropdownTrigger from 'components/Dropdown/DropdownTrigger'
import Dropdown from 'components/Dropdown'

import helpers from 'lib/helpers'
import socket from 'lib/socket'
import $ from 'jquery'
import 'velocity'
import moment from 'moment-timezone'

import SpinLoader from 'components/SpinLoader'
import DropdownItem from 'components/Dropdown/DropdownItem'
import DropdownSeparator from 'components/Dropdown/DropdownSeperator'

class TicketsContainer extends React.Component {
  selectedTickets = []
  constructor (props) {
    super(props)

    this.onTicketUpdated = this.onTicketUpdated.bind(this)
  }
  componentDidMount () {
    socket.socket.on('$trudesk:client:ticket:updated', this.onTicketUpdated)

    this.props.fetchTickets({ page: this.props.page, type: this.props.view })

    $('tr.overdue td').velocity(
      { backgroundColor: '#b71c1c', color: '#ffffff' },
      {
        loop: true,
        easing: [1],
        duration: 800
      }
    )
  }

  componentWillUnmount () {
    this.props.unloadTickets()
    socket.socket.off('$trudesk:client:ticket:updated', this.onTicketUpdated)
  }

  onTicketUpdated (data) {
    this.props.ticketUpdated(data)
  }

  onTicketCheckChanged (e, id) {
    if (e.target.checked) this.selectedTickets.push(id)
    else this.selectedTickets = without(this.selectedTickets, id)

    this.selectedTickets = uniq(this.selectedTickets)
  }

  onSetStatus (status) {}

  render () {
    return (
      <div>
        <PageTitle
          title={'Tickets'}
          shadow={false}
          rightComponent={
            <div className={'uk-float-right'}>
              <TitlePagination
                limit={50}
                total={this.props.totalCount}
                type={this.props.view}
                prevEnabled={this.props.prevEnabled}
                nextEnabled={this.props.nextEnabled}
                currentPage={this.props.page}
                prevPage={this.props.prevPage}
                nextPage={this.props.nextPage}
              />
              <DropdownTrigger pos={'bottom-right'} offset={5} extraClass={'uk-float-left'}>
                <PageTitleButton />
                <Dropdown small={true} width={120}>
                  <DropdownItem text={'Create'} onClick={() => this.props.showModal('CREATE_TICKET')} />
                  <DropdownSeparator />
                  <DropdownItem
                    text={'Set Open'}
                    onClick={() => {
                      console.log(this.selectedTickets)
                    }}
                  />
                  <DropdownItem text={'Set Pending'} />
                  <DropdownItem text={'Set Closed'} />
                  <DropdownSeparator />
                  <DropdownItem text={'Delete'} extraClass={'text-danger'} />
                </Dropdown>
              </DropdownTrigger>
            </div>
          }
        />
        <PageContent padding={0} paddingBottom={0} extraClass={'uk-position-relative'}>
          <SpinLoader active={this.props.loading} />
          <Table
            style={{ margin: 0 }}
            extraClass={'pDataTable'}
            stickyHeader={true}
            striped={true}
            headers={[
              <TableHeader key={0} width={45} height={50} />,
              <TableHeader key={1} width={60} text={'Status'} />,
              <TableHeader key={2} width={65} text={'#'} />,
              <TableHeader key={3} width={'23%'} text={'Subject'} />,
              <TableHeader key={4} width={110} text={'Created'} />,
              <TableHeader key={5} width={125} text={'Requester'} />,
              <TableHeader key={6} text={'Customer'} />,
              <TableHeader key={7} text={'Assignee'} />,
              <TableHeader key={8} width={110} text={'Due Date'} />,
              <TableHeader key={9} text={'Updated'} />
            ]}
          >
            {this.props.tickets.map(ticket => {
              const status = () => {
                switch (ticket.get('status')) {
                  case 0:
                    return 'new'
                  case 1:
                    return 'open'
                  case 2:
                    return 'pending'
                  case 3:
                    return 'closed'
                }
              }
              const assignee = () => {
                const a = ticket.get('assignee')
                return !a ? '--' : a.get('fullname')
              }
              const updated = ticket.get('updated')
                ? helpers.formatDate(ticket.get('updated'), helpers.getShortDateFormat()) +
                  ', ' +
                  helpers.formatDate(ticket.get('updated'), helpers.getTimeFormat())
                : '--'

              const dueDate = ticket.get('dueDate')
                ? helpers.formatDate(ticket.get('dueDate'), helpers.getShortDateFormat())
                : '--'

              const overdue = () => {}

              return (
                <TableRow
                  className={`ticket-${status()}`}
                  key={ticket.get('_id')}
                  clickable={true}
                  onClick={e => {
                    const td = e.target.closest('td')
                    const input = td.getElementsByTagName('input')
                    if (input.length > 0) return false
                    History.pushState(null, `Ticket-${ticket.get('uid')}`, `/tickets/${ticket.get('uid')}`)
                  }}
                >
                  <TableCell
                    className={'ticket-priority nbb vam'}
                    style={{ borderColor: ticket.getIn(['priority', 'htmlColor']), padding: '18px 15px' }}
                  >
                    <input
                      type='checkbox'
                      id={`c_${ticket.get('_id')}`}
                      style={{ display: 'none' }}
                      onChange={e => this.onTicketCheckChanged(e, ticket.get('_id'))}
                      className='svgcheckinput'
                    />
                    <label htmlFor={`c_${ticket.get('_id')}`} className='svgcheck'>
                      <svg width='16px' height='16px' viewBox='0 0 18 18'>
                        <path d='M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z' />
                        <polyline points='1 9 7 14 15 4' />
                      </svg>
                    </label>
                  </TableCell>
                  <TableCell className={`ticket-status ticket-${status()} vam nbb uk-text-center`}>
                    <span className={'uk-display-inline-block'}>{status()[0].toUpperCase()}</span>
                  </TableCell>
                  <TableCell className={'vam nbb'}>{ticket.get('uid')}</TableCell>
                  <TableCell className={'vam nbb'}>{ticket.get('subject')}</TableCell>
                  <TableCell className={'vam nbb'}>
                    {helpers.formatDate(ticket.get('date'), helpers.getShortDateFormat())}
                  </TableCell>
                  <TableCell className={'vam nbb'}>{ticket.getIn(['owner', 'fullname'])}</TableCell>
                  <TableCell className={'vam nbb'}>{ticket.getIn(['group', 'name'])}</TableCell>
                  <TableCell className={'vam nbb'}>{assignee()}</TableCell>
                  <TableCell className={'vam nbb'}>{dueDate}</TableCell>
                  <TableCell className={'vam nbb'}>{updated}</TableCell>
                </TableRow>
              )
            })}
          </Table>
        </PageContent>
      </div>
    )
  }
}

TicketsContainer.propTypes = {
  view: PropTypes.string.isRequired,
  page: PropTypes.string.isRequired,
  prevPage: PropTypes.string.isRequired,
  nextPage: PropTypes.string.isRequired,
  prevEnabled: PropTypes.bool.isRequired,
  nextEnabled: PropTypes.bool.isRequired,
  tickets: PropTypes.object.isRequired,
  totalCount: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
  fetchTickets: PropTypes.func.isRequired,
  unloadTickets: PropTypes.func.isRequired,
  ticketUpdated: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired
}

TicketsContainer.defaultProps = {
  view: 'active',
  page: 0
}

const mapStateToProps = state => ({
  tickets: state.ticketsState.tickets,
  totalCount: state.ticketsState.totalCount,
  loading: state.ticketsState.loading
})

export default connect(
  mapStateToProps,
  { fetchTickets, unloadTickets, ticketUpdated, showModal }
)(TicketsContainer)
