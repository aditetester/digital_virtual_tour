type DownloadItem = {
  id: string;
  imageUrl: string;
  downloadUrl: string;
  title?: string;
  description?: string;
  createdAt: string;
};

export class DownloadStorage {
  private static items: DownloadItem[] = [
    {
      id: "demo1",
      imageUrl: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
      downloadUrl: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800",
      title: "Demo PDF File",
      description: "A sample PDF file for testing downloads",
      createdAt: new Date().toISOString(),
    },
    {
      id: "demo2",
      imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800",
      downloadUrl: "https://raw.githubusercontent.com/mdn/learning-area/master/html/multimedia-and-embedding/images-in-html/dinosaur.jpg",
      title: "Sample Image",
      description: "A sample image for testing cloud downloads",
      createdAt: new Date().toISOString(),
    },
  ];

  static getAll(): DownloadItem[] {
    return this.items;
  }

  static add(item: Omit<DownloadItem, 'id' | 'createdAt'>): DownloadItem {
    const newItem: DownloadItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
    };
    this.items.push(newItem);
    return newItem;
  }

  static remove(id: string): boolean {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }
}
