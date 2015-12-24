# -*- coding: utf-8 -*-
import json
import math
import networkx as nx
from networkx.readwrite import json_graph
from random import randint
import numpy as np
#from numpy import array
import warnings
import requests

from django.db import models
from django.db import connections
from django.http import HttpResponse, HttpResponseRedirect

from .zgraph import *

#
#
# общие функции


# Преобразование вложенных списков в одномерный массив
def flatlist(list_of_lists):
    flattened = []
    for sublist in list_of_lists:
        for val in sublist:
                flattened.append(val)
    return flattened


# Обработка вывода сообщения об ошибке
def returnErrorMessage(message):
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    print(message)
    response.write(message)
    return response 


# Функция которая получает на вход словарь где: ключ = int, значение = bool;
# и возвращает список только тех элементов, где значение True
def flatten_int_by_true(d):
    if len(d) > 0:
        l = []
        for obj in d:
            if d[obj]:
                l.append(int(obj))
    return l


# Функция для вывода отладочной информации
def pdev(str):
    print('\n',str,'\n')
    return True


# Форматирование данных в формате json при выводе
def print_json(data):
    print(json.dumps(data, indent=4, sort_keys=True, ensure_ascii=False))


# Вывод сформированных данных для отладочных целей 
def render_content(content):
    response = HttpResponse()
    response['Content-Type'] = "text/javascript; charset=utf-8"
    print(content)
    response.write(content)
    return response 


# /общие функции
#
#


#
#
# serializers.py

# Получение способа компоновки средствами библиотеки NetworkX; способ может меняться на основе параметра, выбранного пользователем
def get_graph_layout(G, argument):
    switcher = {
        'spring': nx.spring_layout(G,scale=0.9),
        'shell': nx.shell_layout(G,scale=0.9),
        'random': nx.random_layout(G),
    }
    #layout = nx.spectral_layout(G,scale=0.7)
    #layout = nx.graphviz_layout(G,prog='neato')
    func = switcher.get(argument, nx.spring_layout(G,scale=0.4))
    return func


# Формирование модели данных для их дальнейшей визуализации в виде графа: обработка и фильтрация графа; формирование и добавление данных, не рассчитываемых на этапе создания способа компоновки, но необходимых для визуализации в нашем конкретном случае.
def to_main_graph(body, gfilter=None):
    data = {} # Объявляем словарь, в который будет записана вся необходимая для вывода графа информация
    H = json.loads(body) # Декодируем json-объект - структуру графа
    BG = json_graph.node_link_graph(H) # Преобразуем структура графа в формате json в объект типа граф библиотеки NetworkX
    FG = json_graph.node_link_graph(H) # Инициализируем граф для последовательной фильтрации

    # Если передан массив фильтрующих атрибутов, 
    # декодируем json-объект gfilter - массив параметров, полученных из url 
    # и производим фильтрацию в соответствии с полученными данными:
    layoutArgument = ''
    try: 
        gfilter = json.loads(gfilter) # Получаем ассоциативный массив данных фильтра в формате json 
        print_json(gfilter) # отладочная информация
        #print('FGin',FG.nodes())
        FG = GFilterNodeData(FG, BG, gfilter.get('data')) # Оставляем в графе только те узлы, атрибут data которых совпадает с переданной строкой
        FG = GFilterTaxonomy(FG, BG, gfilter.get('taxonomy')) # Производим фильтрацию узлов графа по переданному массиву терминов таксономии
        #print('FG1',FG.nodes())
        #G = GFilterAttributes(FG, gfilter.get('attributes')) # Производим фильтрацию графа по атрибутам узла
        FG = GFilterNodes(FG, gfilter.get('nodes')) # Производим фильтрацию графа по переданным в списке nodes узлам
        FG = GIncludeNeighbors(FG, BG, int(gfilter.get('depth'))) # Включаем в граф соседей для текущих узлов
        FG = GJoinPersons(FG, gfilter.get('joinPersons')) # Объединяем узлы типа Персона по значению атрибута Фамилия
        #print('FG2',FG.nodes())
        layoutArgument = gfilter.get('layout') # Получаем значение выбранного способа компоновки (layout)
        #print('FGout',FG.nodes())
    except:
        warnings.warn('Ошибка при обработке json-массива gfilter', UserWarning)
        #raise
    layout = get_graph_layout(FG, layoutArgument)
    #layout = nx.random_layout(G),
    #nodes = G.nodes(data=True)
    nodes = FG.nodes()
    #data = {'nodes':[], 'links':[]}
    data.update({'nodes':{}})
    #e = nx.edges(G)
    #e = G.edges()
    #links = {'links': e}
    #data.update(links)
    maxx,maxy,minx,miny,averagex,averagey,diffx,diffy = 0,0,0,0,0,0,0,0
    averageScale,scale = 1,1
    for nid in layout:
        point = layout.get(nid)
        x = point[0]
        y = point[1]

        # Вычисляем максимальные, минимальные и средние значения
        maxx = x if x > maxx else maxx
        maxy = y if y > maxy else maxy
        minx = x if x < minx else minx
        miny = y if y < miny else miny
        averagex = maxx - (math.fabs(maxx) + math.fabs(minx)) / 2
        averagey = maxy - (math.fabs(maxy) + math.fabs(miny)) / 2
        diffx = math.fabs(maxx) + math.fabs(minx)
        diffy = math.fabs(maxy) + math.fabs(miny)
        scale = diffx if diffx > diffy else diffy
        if scale != 0:
            averageScale = 0.8 / scale

        data['nodes'][nid] = {
            'id': nid, 
            'data': FG.node[nid]['data'], 
            'degree': FG.degree(nid),
            'x':str(x),
            'y':str(y), 
            'taxonomy': FG.node[nid]['taxonomy'],
            'attributes': FG.node[nid]['attributes'],
            'neighbors': FG.neighbors(nid),
        }
    data.update({'maxx': str(maxx), 'maxy': str(maxy), 'minx': str(minx), 'miny': str(miny)})
    data.update({'averagex': averagex, 'averagey': averagey, 'averageScale': averageScale})
    data.update({'diffx': diffx, 'diffy': diffy})
    data = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False)
    return data

# /serializers.py
#
#

class StorageGraph(models.Model):
    title = models.CharField(max_length=200, default='граф')
    layout_spring = models.TextField()
    body = models.TextField()

    def __str__(self):
        name = 'id_' + str(self.pk) + ': ' + self.title
        return name

class Node(models.Model):
    id = models.PositiveIntegerField()
    data = models.CharField(max_length=500)

    class Meta:
        abstract = True


def dictfetchall(cursor):
    "Returns all rows from a cursor as a dict"
    desc = cursor.description
    return [
        dict(zip([col[0] for col in desc], row))
        for row in cursor.fetchall()
    ]


#
#
# zdb.py 

# Определение списока id терминов таксономии, входящих (детей) в термин Территория
def get_taxonomy_territory_list(parent_id=45, l=None):
    if not l:
        l = [parent_id]
    #get_taxonomy_territory_list.l.append(parent_id)
    cursor = connections['mysql'].cursor()
    sql = "SELECT id, parent_id FROM taxonomy WHERE parent_id=%i" % (parent_id)
    cursor.execute(sql)
    terms = cursor.fetchall()
    for term in terms:
        #print('tid',term[0])
        #print('parent_id',term[1])
        l.append(term[0])
        #if term[1]:
            #get_taxonomy_territory_list(term[1])
    
    return l


def find_values(id, json_repr):
    results = []
    def _decode_dict(a_dict):
        try: results.append(a_dict[id])
        except KeyError: pass
        return a_dict

    json.loads(json_repr, object_hook=_decode_dict)  # return value ignored
    return results


#
#
# Создание графа из массива связанных данных, содержащихся в СУБД, на основе массива параметров сформированного пользователем
class SGraph():
    # Получение таксономии информационного объекта вида узел
    def get_node_taxonomy(self, nid, nodeData):
        sql = "SELECT tax.* FROM element_taxonomy as elt, taxonomy as tax WHERE elt.element_id=%i AND elt.taxonomy_id=tax.id" % (nid)
        self.cursor.execute(sql)
        term = self.cursor.fetchone()
        data = {'tid':term[0],'parent_tid':term[1],'name':term[3]}
        #print('geotag',term[0])
        if term[0] in self.taxTerritory:
            r = requests.get('https://geocode-maps.yandex.ru/1.x/?format=json&geocode=' + nodeData)
            resp = r.json()['response']
            #print(find_values('Point', resp))
            #json_repr = '{"P1": "ss", "Id": 1234, "P2": {"P1": "cccc"}, "P3": [{"P1": "aaa"}]}'
            #print(find_values('P1', json_repr))
            try:
                pos = resp.get('GeoObjectCollection').get('featureMember')[0].get('GeoObject').get('Point').get('pos')
                data.update({'geotag': pos})
            except:
                data.update({'geotag': nodeData})

        return data


    # Получение атрибутов информационного объекта вида узел
    def get_node_attributes(self, nid):
        sql = "SELECT p.id, p.name, ep.str_val \
        FROM property as p, element_property as ep \
        WHERE p.id=ep.property_id AND ep.element_id=%i" % (nid)
        self.cursor.execute(sql)
        attributes = self.cursor.fetchall()
        data = []
        for attribute in attributes:
            data.append({'id':attribute[0],'name':attribute[1],'value':attribute[2]})
        nodeAttributes = data

        return nodeAttributes


    # Получение атрибутов информационного объекта вида дуга
    def get_edge_attributes(self, element_id):
        return ''


    # Добавление узла в граф при создании многомерной проекции "семантической кучи"
    def add_node(self, nid):
        # Для предотвращения случайного дублирования одного и того же узла с одинаковым id, но 
        # с разным типом данных - int и str, производим преобразование типов
        nid = int(nid)
        # Получаем значение поля data
        sql = "SELECT el.data  FROM element as el WHERE el.id=%i" % (nid)
        self.cursor.execute(sql)
        row = self.cursor.fetchone()
        # Получаем значение поля data, убираем лишние пробелы
        nodeData = ' '.join(str(row[0]).split())

        # Для каждого узла с помощью отдельной функции получаем словарь атрибутов
        nodeAttributes = self.get_node_attributes(nid)
        # Для каждого узла с помощью отдельной функции получаем тип узла
        nodeTaxonomy = self.get_node_taxonomy(nid, nodeData)
        
        # Симуляция обработки данных о должности персоны
        if nodeTaxonomy['tid'] == 1 and self.positions:
            count = len(self.positions) - 1
            rand = randint(0,count)
            #print('rand',rand)
            position = self.positions[rand][0]
            nodeAttributes.append({'val': 'position', 'display': position, 'name': 'Должность'})
            #print(nodeAttributes)
        # /Симуляция обработки данных о должности персоны
        
        # Добавляем узел в граф вместе с полученнымы словарями атрибутов, таксономии
        # В качестве атрибута data указываем значение поля data у заданного nid'ом информационного объекта 
        self.G.add_node(nid, data=nodeData, attributes=nodeAttributes, taxonomy=nodeTaxonomy)

        return nid


    # Добавление дуги к указанному узлу
    def add_node_with_edges(self, nid):
        sql = "SELECT el.id, el.element_id_1, el.element_id_2, el.data \
            FROM element as el \
            WHERE el.element_id_1=%i OR el.element_id_2=%i" \
            % (nid, nid)
        self.cursor.execute(sql) # Выполняем sql-запрос
        edges = dictfetchall(self.cursor) # Получаем массив значений результата sql-запроса в виде словаря
        # Проходимся в цикле по всем строкам результата sql-запроса и добавляем в граф дуги
        # и сопутствующие данные к новым узлам графа
        for edge in edges:
            enid = edge['element_id_2'] if nid == edge['element_id_1'] else edge['element_id_1']
            # Для каждой дуги с помощью отдельной функции получаем словарь атрибутов.
            edgeAttributes = self.get_edge_attributes(edge['id'])
            # Добавляем дугу в граф для указанного узла и её атрибуты
            self.G.add_edge(nid, enid, id=edge['id'], data=edge['data'], attributes=edgeAttributes)
            # Добавляем в граф отсутствующий узел
            self.add_node(enid)

        return True


    # Главная функция создания максимально большого графа 
    def create(self, stopper, taxonomy):
        pdev("creating max graph...")
        # Cоздаём пустой NetworkX-граф
        self.G = nx.Graph()
        # Устанавливаем соединение с БД, в которой хранятся семантически связанные данные
        self.cursor = connections['mysql'].cursor()

        # Получаем список id терминов таксономии, входящих (детей) в термин Территория
        #print('territoryTaxonomy',get_taxonomy_territory_list())
        self.taxTerritory = get_taxonomy_territory_list()

        # Добавляем сортировку по терминам классификатора сущностей
        taxonomy = flatten_int_by_true(taxonomy)
        tax = str(taxonomy).strip('[]')

        # Формируем sql-запрос к таблице elements, содержащей информационные объекты (далее ИО)
        # объекты со значением ent_or_rel=1 -  являются вершинами нашего графа
        sql = "SELECT * FROM element as e, element_taxonomy as et \
            WHERE e.is_entity=1 AND e.id=et.element_id AND et.taxonomy_id IN (%s)" % (tax)
        self.cursor.execute(sql) # Выполняем sql-запрос
        nodes = self.cursor.fetchall() # Получаем массив значений результата sql-запроса

        # В цикле проходимся по каждой строке результата запроса и добавляем в граф узлы
        counter = 0 # счётчик ограничения узлов нужен только на стадии разработки для экономии ресурсов 
        for node in nodes:
            nid = int(node[0]) # id узла
            # Если ID узла является цифровым значением и не равно нулю:
            if nid and counter < stopper:
                counter = counter + 1
                # Добавляем узел в объект типа граф, предоставленного библиотекой NetworkX
                # positions - массив должностей, count - кол-во; нужно для симуляции обработки должности
                self.add_node(nid)
                # Добавляем дуги к указанному узлу
                self.add_node_with_edges(nid)

        return self.G


# /Создаем граф из данных "семантической кучи";
#
#


def create_filtered_graph(gfilter):
    try: 
        gfilter = json.loads(gfilter)
        print_json(gfilter)

        # Создаем граф из данных "семантической кучи";
        # производим фильтрацию узлов графа по переданному массиву типов сущностей taxonomy;
        SG = SGraph()
        G = SG.create(int(gfilter.get('stopper')), gfilter.get('taxonomy'))

        # Исключаем из графа узлы с нулевым весом (без связей)
        G = GFilterZero(G, gfilter['options'].get('removeZero'))
        #G = GFilterAttributes(G, gfilter.get('attributes')) # Фильтрация узлов графа по переданным в ассоциативном массивe attributes атрибутам узлов;
    except:
        warnings.warn('Ошибка при обработке json-массива gfilter', UserWarning)
        raise

    data = json_graph.node_link_data(G) # Средствами бибилиотеки NetworkX, экспортируем граф в виде подходящeм для json-сериализации
    graph = StorageGraph() # Создаём экземпляр класса Graph, для хранения структуры графа в базе данных
    numberOfNodes = G.number_of_nodes() # Получаем кол-во узлов графа
    numberOfEdges = G.number_of_edges() # Получаем кол-во дуг графа
    graph.title = "Проекция: узлов " + str(numberOfNodes) + "; дуг " + str(numberOfEdges) # Определяем заголовок графа
    graph.body = json.dumps(data, ensure_ascii=False) # Преобразуем данные в json-формат
    graph.layout_spring = to_main_graph(graph.body) # получаем массив компоновки по-умолчанию (типа spring)
    graph.save() # Сохраняем граф в собственную базу данных

    #jsonContent = json.dumps(data, sort_keys=True, indent=4, separators=(',', ': '), ensure_ascii=False); print(jsonContent) # отладочная информация
    pdev('yзлов %i, дуг %i' % (numberOfNodes, numberOfEdges)) # отладка: выводим кол-во узлов и дуг

    return graph.body


#
#
# Класс для работы с таксономией
class Taxonomy():
    def get_taxonomy(self, tid=None):
        data = []
        cursor = connections['mysql'].cursor()
        # Получаем массив "детей" термина из семантической кучи
        if tid:
            sql = "SELECT * FROM taxonomy WHERE facet_id=1 AND parent_id=%i" % (tid)
        else:
            sql = "SELECT * FROM taxonomy WHERE facet_id=1 AND parent_id IS NULL"
        cursor.execute(sql)
        terms = cursor.fetchall()

        for term in terms:
            parent_tid = term[1]
            children = self.get_taxonomy(term[0])
            data.append({'tid': term[0], 'parent_tid': parent_tid, 'value': term[0], 'display': term[3], 'children': children, 'checked': True})

        return data


#
#

# /zdb.py 
#
#

