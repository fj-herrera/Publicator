import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TextContent } from './entities/text-content.entity.js';
import { CreateTextContentDto } from './dto/create-text-content.dto.js';
import { UpdateTextContentDto } from './dto/update-text-content.dto.js';
import { CreatePublicationTextDto } from './dto/create-publication-text.dto.js';
import { UpdatePublicationTextDto } from './dto/update-publication-text.dto.js';
import { Content } from '../../modules/content/entities/content.entity.js';
import { Text } from '../../modules/text/entities/text.entity.js';
import { Publication } from '../../modules/publication/entities/publication.entity.js';
import { AssetText } from '../../modules/asset-text/entities/asset-text.entity.js';

@Injectable()
export class TextContentService {
  constructor(
    @InjectRepository(TextContent)
    private readonly textContentRepository: Repository<TextContent>,

    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,

    @InjectRepository(Text)
    private readonly textRepository: Repository<Text>,
  ) {}

  async create(
    createTextContentDto: CreateTextContentDto,
  ): Promise<TextContent> {
    const {
      contentId,
      textId,
      type,
    } = createTextContentDto;

    const content = await this.contentRepository.findOneBy({
      id: contentId,
    });

    if (!content) {
      throw new NotFoundException(
        `Content with id ${contentId} not found`,
      );
    }

    let text: Text | null = null;

    if (textId !== undefined) {
      text = await this.textRepository.findOneBy({
        id: textId,
      });

      if (!text) {
        throw new NotFoundException(
          `Text with id ${textId} not found`,
        );
      }
    }

    const textContent = this.textContentRepository.create({
      type,
      content,
      text,
    });

    return await this.textContentRepository.save(textContent);
  }

  async createForPublication(input: CreatePublicationTextDto): Promise<TextContent> {
    return this.textContentRepository.manager.transaction(async (manager) => {
      const publication = await manager.findOne(Publication, {
        where: { id: input.publicationId },
      });
      if (!publication) {
        throw new NotFoundException(`Publication with id ${input.publicationId} not found`);
      }

      let content = await manager.findOne(Content, {
        where: { publication: { id: publication.id } },
        order: { id: 'ASC' },
      });
      if (!content) {
        content = await manager.save(Content, manager.create(Content, { publication }));
      }

      const text = await manager.save(
        Text,
        manager.create(Text, { text: input.text, format: input.format }),
      );
      const association = await manager.save(
        TextContent,
        manager.create(TextContent, { content, text, type: input.type }),
      );

      association.content = content;
      association.text = text;
      return association;
    });
  }

  async updateForPublication(
    id: number,
    input: UpdatePublicationTextDto,
  ): Promise<TextContent> {
    return this.textContentRepository.manager.transaction(async (manager) => {
      const association = await manager.findOne(TextContent, {
        where: { id },
        relations: { content: { publication: true }, text: true },
      });
      if (!association) {
        throw new NotFoundException(`TextContent with id ${id} not found`);
      }

      const currentText = association.text;
      const [publicationUsages, assetUsages] = currentText
        ? await Promise.all([
          manager.count(TextContent, { where: { text: { id: currentText.id } } }),
          manager.count(AssetText, { where: { text: { id: currentText.id } } }),
        ])
        : [0, 0];
      const sharedTextCount = publicationUsages + assetUsages;
      let text: Text;

      if (currentText && sharedTextCount <= 1) {
        currentText.text = input.text;
        currentText.format = input.format;
        text = await manager.save(Text, currentText);
      } else {
        text = await manager.save(
          Text,
          manager.create(Text, { text: input.text, format: input.format }),
        );
      }

      association.text = text;
      association.type = input.type;
      return manager.save(TextContent, association);
    });
  }

  async findAll(): Promise<TextContent[]> {
    return this.textContentRepository.find({
      relations: {
        content: { publication: true },
        text: true,
      },
    });
  }

  async findOne(id: number): Promise<TextContent> {
    const textContent =
      await this.textContentRepository.findOne({
        where: { id },
        relations: {
          content: true,
          text: true,
        },
      });

    if (!textContent) {
      throw new NotFoundException(
        `TextContent with id ${id} not found`,
      );
    }

    return textContent;
  }

  async update(
    id: number,
    updateTextContentDto: UpdateTextContentDto,
  ): Promise<TextContent> {
    const textContent =
      await this.textContentRepository.findOne({
        where: { id },
        relations: {
          content: true,
          text: true,
        },
      });

    if (!textContent) {
      throw new NotFoundException(
        `TextContent with id ${id} not found`,
      );
    }

    if (Object.keys(updateTextContentDto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    if (updateTextContentDto.type !== undefined) {
      textContent.type = updateTextContentDto.type;
    }

    if (updateTextContentDto.contentId !== undefined) {
      const content = await this.contentRepository.findOneBy({
        id: updateTextContentDto.contentId,
      });

      if (!content) {
        throw new NotFoundException(
          `Content with id ${updateTextContentDto.contentId} not found`,
        );
      }

      textContent.content = content;
    }

    if (updateTextContentDto.textId !== undefined) {
      const text = await this.textRepository.findOneBy({
        id: updateTextContentDto.textId,
      });

      if (!text) {
        throw new NotFoundException(
          `Text with id ${updateTextContentDto.textId} not found`,
        );
      }

      textContent.text = text;
    }

    return await this.textContentRepository.save(textContent);
  }

  async remove(id: number): Promise<void> {
    const result =
      await this.textContentRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `TextContent with id ${id} not found`,
      );
    }
  }
}
