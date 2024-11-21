import requests
import json
import time
from you_get import common as you_get
import os
import sys

class BilibiliUpMonitor:
    def __init__(self):
        # 设置请求头
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
    def get_up_videos(self, uid, page_size=30):
        """
        获取UP主最新视频列表
        :param uid: UP主的uid
        :param page_size: 获取的视频数量
        :return: 视频信息列表
        """
        try:
            # B站API接口
            url = f'https://api.bilibili.com/x/space/arc/search'
            params = {
                'mid': uid,
                'ps': page_size,
                'tid': 0,
                'pn': 1,
                'order': 'pubdate',  # 按发布日期排序
                'jsonp': 'jsonp'
            }
            
            response = requests.get(url, headers=self.headers, params=params)
            data = response.json()
            
            if data['code'] == 0:
                videos = data['data']['list']['vlist']
                return videos
            else:
                print(f"获取视频列表失败: {data['message']}")
                return []
                
        except Exception as e:
            print(f"获取视频列表出错: {str(e)}")
            return []

    def download_video(self, bvid, save_path='./videos'):
        """
        下载指定BV号的视频
        :param bvid: 视频的BV号
        :param save_path: 保存路径
        """
        video_url = f'https://www.bilibili.com/video/{bvid}'
        try:
            if not os.path.exists(save_path):
                os.makedirs(save_path)
            
            sys.argv = ['you-get', '-o', save_path, video_url]
            print(f'开始下载视频: {video_url}')
            you_get.main()
            print('下载完成！')
            
        except Exception as e:
            print(f'下载出错: {str(e)}')

    def monitor_up_latest_videos(self, uid, check_interval=3600, save_path='./videos'):
        """
        监控UP主最新视频并下载
        :param uid: UP主的uid
        :param check_interval: 检查间隔（秒）
        :param save_path: 视频保存路径
        """
        downloaded_bvids = set()  # 记录已下载的视频

        while True:
            print(f"\n检查UP主(uid:{uid})的最新视频...")
            videos = self.get_up_videos(uid, page_size=5)  # 获取最新的5个视频
            
            for video in videos:
                bvid = video['bvid']
                title = video['title']
                
                if bvid not in downloaded_bvids:
                    print(f"\n发现新视频：{title}")
                    print(f"BV号：{bvid}")
                    print(f"发布时间：{time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(video['created']))}")
                    
                    # 下载视频
                    self.download_video(bvid, save_path)
                    downloaded_bvids.add(bvid)
            
            print(f"\n等待{check_interval}秒后进行下一次检查...")
            time.sleep(check_interval)

if __name__ == '__main__':
    # UP主的uid
    up_uid = '346563107'  
    
    # 创建监控器实例
    monitor = BilibiliUpMonitor()
    
    # 开始监控UP主的最新视频
    monitor.monitor_up_latest_videos(
        uid=up_uid,
        check_interval=3600*24, # 每24小时检查一次
        save_path='static/videos'
    )