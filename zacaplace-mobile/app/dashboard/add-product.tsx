import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MediaType, launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { apiClient, ApiError } from '@/services/api';
import { Colors } from '@/constants/Colors';
import { CustomAlert } from '../../components/ui/CustomAlert';

interface Category {
  id: string;
  name: string;
}

enum ProductCondition {
  NEW = 'NEW',
  GOOD_CONDITION = 'GOOD_CONDITION',
  USED = 'USED',
  REFURBISHED = 'REFURBISHED',
  OTHER = 'OTHER',
}

const AddProductScreen = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [condition, setCondition] = useState<ProductCondition>(ProductCondition.NEW);
  const [onPromotion, setOnPromotion] = useState(false);
  const [isService, setIsService] = useState(false);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get<Category[]>('/api/categories');
        setCategories(response.data);
        if (response.data.length > 0) {
          setCategoryId(response.data[0].id);
        }
      } catch (error: any) {
        console.error('Erro ao buscar categorias:', error);
        CustomAlert.alert('Erro', 'Não foi possível carregar as categorias.');
      }
    };
    fetchCategories();
  }, []);

  const pickImage = async () => {
    const { status } = await requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      CustomAlert.alert('Permissão necessária', 'Precisamos da permissão para acessar sua galeria de fotos.');
      return;
    }

    let result = await launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (uriToRemove: string) => {
    setImages(images.filter(uri => uri !== uriToRemove));
  };

  const handleSubmit = async () => {
    if (!name || !description || !price || images.length === 0 || !categoryId || !quantity) {
      CustomAlert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios e adicione pelo menos uma imagem.');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        images,
        categoryId,
        quantity: parseInt(quantity, 10),
        condition,
        onPromotion,
        isService,
      };

      const response = await apiClient.post<any>('/api/products', productData);
      CustomAlert.alert('Sucesso', 'Produto adicionado com sucesso!');
      router.back();
    } catch (error: any) {
      console.error('Erro ao adicionar produto:', error);
      if (error instanceof ApiError) {
        CustomAlert.alert('Erro', error.data.message || error.message);
      } else {
        CustomAlert.alert('Erro', 'Ocorreu um erro inesperado ao adicionar o produto.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Stack.Screen options={{ title: 'Adicionar Novo Item' }} />

      <Text style={styles.label}>Nome do Item:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ex: Camiseta Vintage" />

      <Text style={styles.label}>Descrição:</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Descreva seu produto ou serviço em detalhes."
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Preço (R$):</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        placeholder="Ex: 49.90"
      />

      <Text style={styles.label}>Preço Original (Opcional, para promoções R$):</Text>
      <TextInput
        style={styles.input}
        value={originalPrice}
        onChangeText={setOriginalPrice}
        keyboardType="numeric"
        placeholder="Ex: 69.90"
      />

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Em Promoção:</Text>
        <Switch value={onPromotion} onValueChange={setOnPromotion} />
      </View>

      <View style={styles.switchContainer}>
        <Text style={styles.label}>É um Serviço?</Text>
        <Switch value={isService} onValueChange={setIsService} />
      </View>

      <Text style={styles.label}>Imagens:</Text>
      <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
        <Text style={styles.imagePickerButtonText}>Selecionar Imagem</Text>
      </TouchableOpacity>
      <View style={styles.imagePreviewContainer}>
        {images.map((uri, index) => (
          <View key={index} style={styles.imagePreviewWrapper}>
            <Image source={{ uri }} style={styles.imagePreview} />
            <TouchableOpacity onPress={() => removeImage(uri)} style={styles.removeImageButton}>
              <Text style={styles.removeImageButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <Text style={styles.label}>Categoria:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={categoryId}
          onValueChange={(itemValue) => setCategoryId(itemValue)}
        >
          {categories.map((cat) => (
            <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Quantidade:</Text>
      <TextInput
        style={styles.input}
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
        placeholder="Ex: 1"
      />

      <Text style={styles.label}>Condição:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={condition}
          onValueChange={(itemValue) => setCondition(itemValue as ProductCondition)}
        >
          {Object.values(ProductCondition).map((cond) => (
            <Picker.Item key={cond} label={cond.replace(/_/g, ' ')} value={cond} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Adicionar Item</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  contentContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textDark,
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.textDark,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 5,
  },
  imagePickerButton: {
    backgroundColor: Colors.primaryBlue,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  imagePickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: Colors.green,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddProductScreen;