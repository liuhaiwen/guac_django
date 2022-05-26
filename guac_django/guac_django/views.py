#!/usr/bin/env python
# -*- coding: utf-8 -*-
from django.shortcuts import render
from django.http import HttpResponse
import threading,uuid,json,time,base64
from guacamole.client import GuacamoleClient
from dwebsocket.decorators import accept_websocket


def index(request):
	if request.method == 'GET':
		return render(request, 'index.html',locals(),content_type='text/html; charset=utf-8')


@accept_websocket
def jump_ws(request):
	if request.is_websocket():
		try:

			read_lock = threading.RLock()
			write_lock = threading.RLock()

			width=request.GET.get("w",1024)
			height=request.GET.get("h",765)

			guac_client = GuacamoleClient("127.0.0.1",4822)
			guac_client.handshake(protocol='ssh',hostname="127.0.0.1",port=22,username="root",password="liuhaiwen",color_scheme="green-black",width=width,height=height)

			# guac_client.handshake(protocol='ssh',
			# 	hostname="127.0.0.1",port=22,username="root",
			# 	password="liuhaiwen+5688",width=request.GET.get("w"),
			# 	height=request.GET.get("h"),color_scheme="green-black",timeout=3
			# 	# command="mysql -uroot -pliuhaiwen+5688"
			# 	)
			cache_key = str(uuid.uuid4())
			data_json = '0.,{0}.{1};'.format(len(cache_key),cache_key)
			request.websocket.send(data_json)

			def __do_write():
				print "read..."
				with write_lock:
					while True:
						guac_msg = guac_client.receive()
						if guac_msg:
							request.websocket.send(guac_msg)
						else:
							guac_client.close()
							print "done..."
							break;

			def __do_read():
				for msg in request.websocket:
					if msg:
						with read_lock:
							guac_client.send(msg)
					else:
						print "xxxxxxxxxxxxx"
						request.websocket.close()
			# 模拟关闭
			def __do_write2():
				time.sleep(5)
				message = str(base64.b64encode('当前会话已被管理员关闭'))
				data_json = '6.toastr,1.2,{0}.{1};'.format(len(message),message)
				print data_json
				request.websocket.send(data_json)
				guac_client.close()
				print "aaaaa"

			threading.Thread(target=__do_write, args=()).start()


			__do_read()


		except Exception as e:
			pass
		

	