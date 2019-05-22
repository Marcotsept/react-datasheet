import React, { PureComponent } from 'react'
import Select from 'react-select'

import DataSheet from '../lib'
import {ENTER_KEY, TAB_KEY} from '../lib/keys'

const Header = (props) => {
  const { className, col } = props
  return <th className={className} style={{ width: col.width }}>{col.label}</th>
}

class SheetRenderer extends PureComponent {
  render () {
    const { className, columns, onColumnDrop } = this.props
    return (
      <table className={className}>
        <thead>
        <tr>
          {
            columns.map((col, index) => (
              <Header key={col.label} col={col} columnIndex={index} onColumnDrop={onColumnDrop} />
            ))
          }
        </tr>
        </thead>
        <tbody>
        {this.props.children}
        </tbody>
      </table>
    )
  }
}
// {/*<td className='cell read-only row-handle' key='$$actionCell' />*/}
const RowRenderer = (props) => {
  const { className, children } = props
  return (
    <tr className={className}>
      { children }
    </tr>
  )
}

class Cell extends React.PureComponent {
  render () {
    console.log('render')
    const {
      cell, row, col, attributesRenderer,
      className, style, onMouseDown, onMouseOver, onDoubleClick, onContextMenu
    } = this.props

    const {colSpan, rowSpan} = cell
    const attributes = attributesRenderer ? attributesRenderer(cell, row, col) : {}

    return (
      <td
        className={className}
        onMouseDown={onMouseDown}
        onMouseOver={onMouseOver}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        colSpan={colSpan}
        rowSpan={rowSpan}
        style={style}
        {...attributes}
      >
        {this.props.children}
      </td>
    )
  }
}

class SelectEditor extends PureComponent {
  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.state = {}
  }

  handleChange (opt) {
    const {onCommit, onRevert} = this.props
    if (!opt) {
      return onRevert()
    }
    const { e } = this.state
    onCommit(opt.value, e)
    console.log('COMMITTED', opt.value)
  }

  handleKeyDown (e) {
    // record last key pressed so we can handle enter
    if (e.which === ENTER_KEY || e.which === TAB_KEY) {
      e.persist()
      this.setState({ e })
    } else {
      this.setState({ e: null })
    }
  }

  render () {
    return (
      <Select
        autoFocus
        openOnFocus
        closeOnSelect
        value={this.props.value}
        onChange={this.handleChange}
        onInputKeyDown={this.handleKeyDown}
        options={[
          {label: '1', value: 1},
          {label: '2', value: 2},
          {label: '3', value: 3},
          {label: '4', value: 4},
          {label: '5', value: 5}
        ]}
      />
    )
  }
}

class RangeEditor extends PureComponent {
  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
  }

  componentDidMount () {
    this._input.focus()
  }

  handleChange (e) {
    this.props.onChange(e.target.value)
  }

  render () {
    const {value, onKeyDown} = this.props
    return (
      <input
        ref={input => { this._input = input }}
        type='range'
        className='data-editor'
        value={value}
        min='1'
        max='5'
        onChange={this.handleChange}
        onKeyDown={onKeyDown}
      />
    )
  }
}

const FillViewer = props => {
  const { value } = props
  return (
    <div style={{width: '100%'}}>
      {[1, 2, 3, 4, 5].map(v => {
        const backgroundColor = v > value ? 'transparent' : '#007eff'
        return (
          <div key={v} style={{float: 'left', width: '20%', height: '17px', backgroundColor}} />
        )
      })}
    </div>
  )
}

class CustomRendererSheet extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      columns: [
        { label: 'Style', width: '40%' },
        { label: 'IBUs', width: '20%' },
        { label: 'Color (SRM)', width: '20%' },
        { label: 'Rating', width: '20%' }
      ],
      grid: [
        [{ value: 'Ordinary Bitter'}, { value: '20 - 35'}, { value: '5 - 12'}, { value: 4, dataEditor: RangeEditor }],
      ].map((a, i) => a.map((cell, j) => Object.assign(cell, {key: `${i}-${j}`})))
    }

    this.handleColumnDrop = this.handleColumnDrop.bind(this)
    this.handleRowDrop = this.handleRowDrop.bind(this)
    this.handleChanges = this.handleChanges.bind(this)
    this.renderSheet = this.renderSheet.bind(this)
    this.renderRow = this.renderRow.bind(this)
    this.renderCell = this.renderCell.bind(this)
  }

  handleColumnDrop (from, to) {
    const columns = [...this.state.columns]
    columns.splice(to, 0, ...columns.splice(from, 1))
    const grid = this.state.grid.map(r => {
      const row = [...r]
      row.splice(to, 0, ...row.splice(from, 1))
      return row
    })
    this.setState({ columns, grid })
  }

  handleRowDrop (from, to) {
    const grid = [ ...this.state.grid ]
    grid.splice(to, 0, ...grid.splice(from, 1))
    this.setState({ grid })
  }

  handleChanges (changes) {
    const grid = this.state.grid.map(row => [...row])
    changes.forEach(({cell, row, col, value}) => {
      if (grid[row] && grid[row][col]) {
        grid[row][col] = {...grid[row][col], value}
      }
    })
    this.setState({grid})
  }

  renderSheet (props) {
    return <SheetRenderer columns={this.state.columns} onColumnDrop={this.handleColumnDrop} {...props} />
  }

  renderRow (props) {
    const {row, cells, ...rest} = props
    return <RowRenderer rowIndex={row} onRowDrop={this.handleRowDrop} {...rest} />
  }

  renderCell (props) {
    return <Cell columns={this.state.columns} {...props} />
  }

  render () {
    return (
      <DataSheet
        data={this.state.grid}
        valueRenderer={(cell) => cell.value}
        sheetRenderer={this.renderSheet}
        rowRenderer={this.renderRow}
        onCellsChanged={this.handleChanges}
        cellRenderer={this.renderCell}
      />
    )
  }
}

export default CustomRendererSheet
