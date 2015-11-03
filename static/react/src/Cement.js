/*
* Общие компоненты для многоразового использования
*/
function joinAsTrue(obj) {
    var prop
    var joinAsTrue = []
    for (prop in obj) {
        //console.log('filterAttributes > ',obj[prop])

        if (obj[prop] === true) {
            //console.log('prop ',prop,' > ',obj[prop])
            //console.log('filterAttributes > ',obj)
            joinAsTrue.push(prop)
        }
    }
    //console.log('joinAsTrue > ',joinAsTrue)
    return joinAsTrue
}


// Компонент группы кнопок-переключателей
var CMRadioGroup = React.createClass({
    getInitialState: function() {
        return {
            // Ассоциативный массив всех определяющих компонент атрибутов
            //componentState: {},
        }
    },
    handleChange: function(value) {
        /*
        var state = this.state.componentState
        state[key] = value
        this.setState({ componentState: state })
        console.log('> ',state)
        */

        // Передаём родителю состояние массива componentState
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(this.props.name, value, this.props.name)
        }
    },
    handleReClick: function() {
        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.onClick === 'function') {
            this.props.onClick()
        }
    },
    render: function() {
        var rows = []
        this.props.properties.forEach(function(prop, key) {
            // Формируем массив rows дочерних компонентов
            rows.push(<CMRadioGroupButton 
                key={key}
                value={prop.value}
                display={prop.display} 
                checked={prop.checked}
                onChange={this.handleChange}
                onClick={this.handleReClick} 
            />)
        }.bind(this))

        return (
            <div className="btn-group" data-toggle="buttons">
            {rows}
            </div>
        )
    },
})


var CMRadioGroupButton = React.createClass({
    propTypes: {
        value:      React.PropTypes.string,
        display:    React.PropTypes.string,
        checked:    React.PropTypes.bool,
        onChange:   React.PropTypes.func,
        onClick:    React.PropTypes.func,
    },
    getDefaultProps: function() {
        return {
            value: '',
            display: '',
            checked: false,
        };
    },
    getInitialState: function() {
        var className = this.props.checked ? "btn btn-primary active" : "btn btn-primary"

        if (this.props.checked) {
            // Передаём родителю состояние переменных value и checked
            if (typeof this.props.onChange === 'function') {
                this.props.onChange(this.props.value)
            }
        }

        return {
            checked: this.props.checked,
            className: className,
        }
    },
    handleClick: function() {
        this.setState({ checked: true })

        // Передаём родителю состояние переменных value и checked
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(this.props.value)
        }

        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.onClick === 'function') {
            this.props.onClick()
        }

        // Обновляем статус чекбокса
        //React.findDOMNode(this.refs.radio).checked = true
    },
    render: function() {
        return (
            <label 
                className={this.state.className} 
                onClick={this.handleClick}
            >
            <input
                type="radio" 
                ref="radio"
                defaultChecked={this.state.checked}
            />
            {this.props.display}
        </label>
        )
    },
})


var CMCheckboxGroup = React.createClass({
    propTypes: {
        // вызывает родительскую функцию onChange и параметры к ней
        onChange:   React.PropTypes.func, 

        // вызывает родительскую функцию onClick и параметры к ней
        onClick:    React.PropTypes.func,
    },
    getInitialState: function() {
        return {
            // Ассоциативный массив всех определяющих компонент атрибутов
            componentState: {},
        }
    },
    // Обновляем ассоциативный массив всех определяющих компонент атрибутов
    handleChange: function(key, value, obj) {
        var state = this.state.componentState
        state[key] = value
        this.setState({ componentState: state })

        // Передаём родителю состояние массива componentState
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(state)
        }

        /*
            joinedState = joinAsTrue(state)
            //console.log('> ',joinedState)
            // Проверяем, выбран ли хотя бы один атрибут
            if (joinedState.length == 0) {
                console.log('Необходимо выбрать хотя бы один атрибут')
                obj.setState({ checked: true })
                obj.setState({ className: "btn btn-primary active" })
                console.log(obj)
                React.findDOMNode(obj.refs.checkbox).checked = true
            } else {
                // Передаём родителю состояние массива componentState
                if (typeof this.props.onChange === 'function') {
                    this.props.onChange(state)
                }
            }
        */
    },
    handleReClick: function(e) {
        //console.log(this.constructor.displayName,' > ',this.state.ComponentState)
        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.onClick === 'function') {
            this.props.onClick(e)
        }
    },
    render: function() {
        var rows = []
        this.props.properties.forEach(function(prop, key) {
            // Формируем массив rows дочерних компонентов
            rows.push(<CMCheckboxButton 
                key={key}
                display={prop.display} 
                value={prop.value.toString()}
                checked={prop.checked}
                onChange={this.handleChange}
                onClick={this.handleReClick} 
            />)
        }.bind(this))

        return (
            <div className="btn-group" data-toggle="buttons">
            {rows}
            </div>
        )
    },
})


var CMCheckboxButton = React.createClass({
    propTypes: {
        value:      React.PropTypes.string,
        display:    React.PropTypes.string,
        checked:    React.PropTypes.bool,
        onChange:   React.PropTypes.func,
        onClick:    React.PropTypes.func,
    },
    getDefaultProps: function() {
        return {
            value: '',
            display: '',
            checked: false,
        };
    },
    getInitialState: function() {
        var className = this.props.checked ? "btn btn-primary active" : "btn btn-primary"

        // Передаём родителю состояние переменных value и checked
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(this.props.value, this.props.checked, this)
        }

        return {
            checked: this.props.checked,
            className: className,
        }
    },
    handleClick: function(e) {
        var checked = this.state.checked ? false : true
        this.setState({ checked: checked })

        // Передаём родителю состояние переменных value и checked
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(this.props.value, checked, this)
        }

        // Передаём обработку клика родительскому компоненту
        if (typeof this.props.onClick === 'function') {
            this.props.onClick(e)
        }

        // Обновляем статус чекбокса
        React.findDOMNode(this.refs.checkbox).checked = checked
    },
    render: function() {
        return (
            <label 
                className={this.state.className} 
                onClick={this.handleClick}
            >
            <input
                type="checkbox" 
                ref="checkbox"
                defaultChecked={this.state.checked}
            />
            {this.props.display}
            </label>
        );
    }
})

/*
* Общие функции javascript для многократного использования 
*/
function randint(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}


function randcolor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color
}


function monthColor(month) {
    var color = []
    color[12] = '#3300FF'
    color[1] = '#3300CC'
    color[2] = '#330099'

    color[3] = '#999900'
    color[4] = '#99CC00'
    color[5] = '#99FF00'

    color[6] = '#CC6600'
    color[7] = '#CC3300'
    color[8] = '#CC0000'

    color[9] = '#CC9900'
    color[10] = '#CCCC00'
    color[11] = '#CCCC33'

    return color[month]
}


// Вычисляем ширину полосы прокрутки
function scrollbarWidth() {
    var div = $('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
    // Append our div, do our calculation and then remove it
    $('body').append(div);
    var w1 = $('div', div).innerWidth();
    div.css('overflow-y', 'scroll');
    var w2 = $('div', div).innerWidth();
    $(div).remove();
    return (w1 - w2);
}


var RecursiveCheckboxTree = React.createClass({
    // Объявление статичных переменных класса
    statics: {
        // Ассоциативный массив состояний всех терминов таксономии
        taxonomyState: {},
    },
    getDefaultProps: function() {
        return {
            key: 'taxonomy',
            tid: null,
            display: 'Выбрать:',
            value: '',
            children: [],
            checked: true,
        }
    },
    getInitialState: function() {
        return {
            children: this.props.children,
            checked: this.props.checked,
            //childrenState: this.props.childrenState,
        }
    },
    /*
    // Производим обработку изменений для родительского компонента
    handleParentChange: function(childTid, childChecked, childChildrenState) {
        console.log('parent change>',this.props.tid)

        var childrenState = this.state.childrenState ? this.state.childrenState : {}
        // Передаём обработку изменений рекурсивному родителю 
        if (typeof this.props.parentChange === 'function') {
            this.props.parentChange(this.props.tid, this.state.checked, childrenState)
        }
        // В случае, когда функция не определена, передаем значения состояний чекбоксов
        // родительскому компоненту для всей таксономии
        else {
            //node = eval('TaxonomyFilter')
            //console.log(React.findDOMNode('TaxonomyFilter'))
            //console.log('typeof',typeof this.props.parentChange)
            console.log('NULL childrenState',childrenState)
        }
        //console.log('CCS>',childChildrenState)
        console.log('childTid',childTid,'CS>',childrenState,'childChecke',childChecked)
        var childrenState = this.state.childrenState
        if (typeof childTid === 'number') {
            //childrenState[childTid.toString()] = childChecked
            //childrenState[childTid] = childChecked
            console.log('this [tid>',this.props.tid,this.state.checked,'] child [child',childTid,childChecked,'CCS',childChildrenState,']')
            //console.log('this childrenState',childrenState)
            // Конкатенация ассоциативного массива состояний потомков данного компонента 
            // с переданным ассоциативным массивом состояний потомков потомка
            if (childChildrenState) {
                Object.keys(childChildrenState).forEach(function(child) {
                    //console.log(childrenState[child])
                    childrenState[child] = childChildrenState[child]
                })
            }
        } 
        // Обновляем значения массива state
        this.setState({ childrenState: childrenState })
        console.log(' ')
    },
    */
    handleChange: function() {
        //console.log('change as change>',this.props.tid)
        // Производим обработку изменений для данного компонента
        var checked = this.state.checked
        checked = checked ? false : true
        // Обновляем значения массива state
        this.setState({ checked: checked })
        // Передаём дальнейшую обработку изменений рекурсивному родителю 
        if (typeof this.props.parentChange === 'function') {
            this.props.parentChange(this.props.tid, checked, this.state.childrenState)
        }
    },
    getState: function() {
        //console.log(this.constructor.taxonomyState)
        if (this.props.tid) {
            this.constructor.taxonomyState[eval(this.props.tid)] = this.state.checked
        }
        this.props.children.forEach(function(term) {
            eval('this.refs.theTaxonomy'+term.tid).getState()
        }.bind(this))
        return this.constructor.taxonomyState
    },
    render: function() {
        //this.getState()
        var rows = []
        //var childrenState = {}
        this.props.children.forEach(function(term, key) {
            // Инициализируем ассоциативный массив состояний чекбоксов дочерних элементов
            //childrenState[term.tid] = term.checked
            // Инициализируем массив дочерних компонентов
            rows.push(<RecursiveCheckboxTree
                key={term.tid}
                ref={'theTaxonomy'+term.tid}
                tid={term.tid}
                value={term.value}
                display={term.display}
                children={term.children}
                checked={term.checked}
                parentChange={this.handleParentChange}
            />)
        }.bind(this))
        //console.log(this.props.tid,'CS',childrenState)
        return (
            <div>
                <label>
                <input 
                    type="checkbox" 
                    value={this.props.value}
                    display={this.props.display} 
                    checked={this.state.checked}
                    //childrenState={childrenState}
                    onChange={this.handleChange}
                />
                {this.props.tid} 
                {this.props.display} 
                <div className="otstup">
                    {rows}
                </div>
                </label>
            </div>
        );
    },
})


// ? добавить обработку ошибки запроса
var TaxonomyFilter = React.createClass({
    loadTaxonomyDataFromServer: function() {
        // url по которому на стороне сервера формируется ассоциативный массив 
        // в формате json существующих типов информационных объектов 
        var url = '/json-taxonomy/'
        var xhr = new XMLHttpRequest()
        xhr.open('GET', url)
        xhr.responseType = 'json'
        xhr.send()
        // Производим обработку данных, после получения ответа от сервера
        xhr.onreadystatechange = function() {
          if(xhr.readyState == 4) { // `DONE`
            this.setState({taxonomyData: xhr.response})
          }
        }.bind(this)
    },
    getInitialState: function() {
        // Получаем данные с сервера в формате json
        this.loadTaxonomyDataFromServer()
        return {
            // Ассоциативный массив данных, полученный с сервера в формате json
            taxonomyData: [],
        }
    },
    getState: function() {
        // Получаем состояние чекбоксов всех компонентов таксономии
        var taxonomyState = eval('this.refs.theTaxonomy').getState()
        /*
        // Передаём обработку родительской функции
        if (typeof this.props._getState === 'function') {
            this.props._getState(taxonomyState)
        }
        */
        return taxonomyState
    },
    render: function() {
        return (
            <div className={'RecursiveCheckboxTree'}>
                <RecursiveCheckboxTree
                    ref={'theTaxonomy'}
                    children={this.state.taxonomyData}
                    display={'Фильтр по типам ИО:'}
                />
            </div>
        );
    },
})


/*
handleParentChange: function(childTid, childChecked, childChildrenState) {
    console.log('parent change>',this.props.tid)
    // Производим обработку изменений для данного компонента
    var checked = this.state.checked
    checked = checked ? false : true
    var childrenState = this.state.childrenState
    //childrenState[childTid.toString()] = childChecked
    // Конкатенация ассоциативного массива состояний потомков данного компонента 
    // с переданным ассоциативным массивом состояний потомков потомка
    if (typeof childTid === 'number') {
        console.log('tid>',this.props.tid,checked,'child',childTid,childChecked)
    }
    //console.log('childrenState',childrenState)
    //console.log(childrenState[childTid])
    //childChildrenState.forEach(function(child, key) { console.log(key,'>',child) })
    // Обновляем значения массива state
    this.setState({ checked: checked, childrenState: childrenState })
    // Передаём рекурсивному родителю уникальный идентификатор текущего компонента и значение state
    if (typeof this.props.onChange === 'function') {
        this.props.onChange(this.props.tid, checked, childrenState)
    }
    console.log(' ')
},


var TaxonomyFilter = React.createClass({
    getInitialState: function() {
        return {
            //state: {},
        }
    },
    handleChange: function(key, value) {
        console.log('TOP lvl change')
        var state = this.state.state
        state[key] = value
        this.setState({ state: state })
        console.log('state',state)
        // Передаём обновлённый словарь состояний родительскому компоненту
        if (typeof this.props.updateTaxonomy === 'function') {
            this.props.updateTaxonomy(state)
        }
    },
    updateState: function(state) {
        console.log('TaxFilterState',state)
    },
    render: function() {
        //console.log(this.state.data)
        return (
            <div ref='TaxonomyFilter'>
                <Taxonomy
                    children={this.state.data}
                    display={'Фильтр по типам ИО:'}
                    //onChange={this.handleChange}
                />
            </div>
        )
    },
})
*/


    /*
    componentDidUpdate: function (props, state) {
        if (this.state.dragging && !state.dragging) {
            document.addEventListener('mousemove', this.onMouseMove)
            document.addEventListener('mouseup', this.onMouseUp)
        } else if (!this.state.dragging && state.dragging) {
            document.removeEventListener('mousemove', this.onMouseMove)
            document.removeEventListener('mouseup', this.onMouseUp)
        }
    },
    onMouseDown: function (e, nid) {
        //console.log(nid)
        if (e.button !== 0) return
        // Устанавливаем флаг перетаскивания объекта в значение истина
        this.setState({dragging: true, nodeToMove: nid,})
        // Прекращает дальнейшую передачу текущего события
        e.stopPropagation()
        // Отменяет действия браузера по умолчанию
        e.preventDefault()
    },
    onMouseUp: function (e) {
        // Устанавливаем флаг перетаскивания объекта в значение ложь
        this.setState({dragging: false})
        e.stopPropagation()
        e.preventDefault()
    },
    onMouseMove: function (e) {
        // Если флаг перетаскивания не истина, отменяем дальнейшую обработку
        if (!this.state.dragging) return
        var x = e.pageX + 1
        var y = e.pageY - 122
        this.setState({
            x: x,
            y: y,
        })
        e.stopPropagation()
        e.preventDefault()
        this.updateGraphNodePos(this.state.nodeToMove, x, y)
        this.updateGraphEdgePos(this.state.edgesToMove, x, y)
    },
    updateGraphNodePos: function (nid, x, y) {
        //console.log(nid,'>',x,'-',y)
        node = eval('this.refs.theGraphNode' + nid)
        //console.log(node)
        node.setState({x: x, y: y,})
    },
    updateGraphEdgePos: function (eids, x, y) {
        eids.forEach(function(eid) {
            edge = eval('this.refs.theGraphEdge' + eid)
            edge.setState({x: x, y: y,})
        })
    },
    */